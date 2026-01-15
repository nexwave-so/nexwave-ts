import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import ora from 'ora';
import chalk from 'chalk';
import prompts from 'prompts';
import { getClient } from '../lib/client';
import {
  formatOutput,
  success,
  formatStatus,
  formatId,
  formatRelativeTime,
  formatTable,
} from '../lib/output';
import { handleError } from '../lib/errors';
import { parseInput } from '../lib/utils';
import {
  CliAgentConfigSchema,
  transformCliAgentConfigToAgentConfig,
} from '../schemas/agent';
import type { Agent, LogEntry } from '@nexwave/types';

/**
 * Format agent table for list command
 */
function formatAgentTable(agents: Agent[]): string {
  if (agents.length === 0) {
    return chalk.dim('No agents found');
  }

  const tableData = agents.map((agent) => ({
    ID: formatId(agent.id),
    Name: agent.name.length > 20 ? agent.name.substring(0, 17) + '...' : agent.name,
    Status: formatStatus(agent.status),
    Schedule: formatSchedule(agent.config.schedule),
    Executions: agent.state.executionCount.toString(),
    'Last Run': agent.state.lastExecutionAt
      ? formatRelativeTime(agent.state.lastExecutionAt)
      : '-',
  }));

  return formatTable(tableData);
}

/**
 * Format agent details for info command
 */
function formatAgentDetails(agent: Agent, format: 'table' | 'json' | 'yaml'): string {
  if (format !== 'table') {
    return formatOutput(agent, format);
  }

  const lines = [
    '',
    chalk.bold(`Agent: ${agent.name}`),
    chalk.dim(`ID: ${agent.id}`),
    '',
    `Status:      ${formatStatus(agent.status)}`,
    `Schedule:    ${formatSchedule(agent.config.schedule)}`,
    `Created:     ${new Date(agent.createdAt).toLocaleString()}`,
    agent.startedAt ? `Started:     ${new Date(agent.startedAt).toLocaleString()}` : '',
    agent.stoppedAt ? `Stopped:     ${new Date(agent.stoppedAt).toLocaleString()}` : '',
    '',
    chalk.bold('Limits'),
    `  Max/day:   ${agent.config.limits?.maxExecutionsPerDay ?? 'unlimited'}`,
    `  Max notional: ${agent.config.limits?.maxDailyNotional ?? 'unlimited'}`,
    `  Circuit breaker: ${agent.config.limits?.circuitBreakerThreshold ?? 'disabled'}`,
    '',
    chalk.bold('State'),
    `  Executions: ${agent.state.executionCount}`,
    `  Daily notional: ${agent.state.dailyNotional}`,
    `  Consecutive failures: ${agent.state.consecutiveFailures}`,
    `  Last execution: ${
      agent.state.lastExecutionAt
        ? new Date(agent.state.lastExecutionAt).toLocaleString()
        : 'never'
    }`,
    `  Next execution: ${
      agent.state.nextExecutionAt
        ? new Date(agent.state.nextExecutionAt).toLocaleString()
        : 'not scheduled'
    }`,
    '',
  ].filter(Boolean);

  return lines.join('\n');
}

/**
 * Format log entry
 */
function formatLogEntry(entry: LogEntry): string {
  const time = chalk.dim(new Date(entry.timestamp).toLocaleTimeString());
  const level = formatLogLevel(entry.level);
  const message = entry.message;

  return `${time} ${level} ${message}`;
}

/**
 * Format log level with color
 */
function formatLogLevel(level: string): string {
  switch (level) {
    case 'ERROR':
      return chalk.red('[ERR]');
    case 'WARN':
      return chalk.yellow('[WRN]');
    case 'INFO':
      return chalk.blue('[INF]');
    case 'DEBUG':
      return chalk.dim('[DBG]');
    default:
      return chalk.dim(`[${level}]`);
  }
}

/**
 * Format schedule for display
 */
function formatSchedule(schedule: any): string {
  if (!schedule) return 'manual';
  if (schedule.once) return 'once';
  if (schedule.cron) return schedule.cron;
  if (schedule.intervalMs) {
    const mins = schedule.intervalMs / 60000;
    if (mins < 60) return `every ${mins}m`;
    return `every ${mins / 60}h`;
  }
  if (schedule.triggerOnly) return 'trigger-only';
  return 'unknown';
}

/**
 * Parse duration string (e.g., "1h", "24h", "7d") to timestamp
 */
function parseDuration(duration?: string): number | undefined {
  if (!duration) return undefined;

  const match = duration.match(/^(\d+)(h|d|m)$/);
  if (!match) return undefined;

  const [, value, unit] = match;
  const ms =
    parseInt(value, 10) *
    {
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }[unit]!;

  return Date.now() - ms;
}

/**
 * Register agent commands
 */
export function registerAgentCommands(program: Command): void {
  const agentCmd = program
    .command('agent')
    .description('Manage execution agents');

  // Create command
  agentCmd
    .command('create')
    .description('Create a new agent')
    .option('-f, --file <path>', 'Agent config file (YAML or JSON)')
    .option('--json <json>', 'Agent config as JSON string')
    .option('-n, --name <name>', 'Override agent name')
    .option('--start', 'Start agent immediately after creation')
    .action(async (options) => {
      const spinner = ora('Creating agent...').start();

      try {
        let configData: unknown;

        if (options.file) {
          const content = readFileSync(options.file, 'utf-8');
          configData = options.file.endsWith('.json')
            ? JSON.parse(content)
            : parseYaml(content);
        } else if (options.json) {
          configData = JSON.parse(options.json);
        } else if (!process.stdin.isTTY) {
          configData = await parseInput('-');
        } else {
          spinner.fail('No config provided. Use -f, --json, or pipe input');
          process.exit(1);
        }

        // Override name if provided
        if (options.name) {
          (configData as any).name = options.name;
        }

        // Validate
        const validation = CliAgentConfigSchema.safeParse(configData);
        if (!validation.success) {
          spinner.fail('Validation failed');
          console.error('Errors:');
          validation.error.errors.forEach((err) => {
            console.error(`  • ${err.path.join('.')}: ${err.message}`);
          });
          process.exit(2);
        }

        // Transform to SDK format
        const { name, config, description } = transformCliAgentConfigToAgentConfig(
          validation.data
        );

        const client = await getClient();
        const result = await client.agents.create({
          name,
          config,
          startImmediately: options.start,
        });

        spinner.succeed('Agent created');
        console.log('');
        console.log(success('Agent created successfully'));
        console.log(`  ID: ${result.id}`);
        console.log(`  Name: ${result.name}`);
        console.log(`  Status: ${formatStatus(result.status)}`);
        if (!options.start) {
          console.log(`  Start: nexwave agent start ${result.id}`);
        }
      } catch (err) {
        spinner.fail('Failed to create agent');
        handleError(err, program.opts().verbose);
      }
    });

  // List command
  agentCmd
    .command('list')
    .description('List all agents')
    .option('-s, --status <status>', 'Filter by status (comma-separated)')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--cursor <cursor>', 'Pagination cursor')
    .action(async (options) => {
      const spinner = ora('Fetching agents...').start();

      try {
        const client = await getClient();

        const status = options.status
          ? options.status.split(',').map((s: string) => s.trim().toUpperCase())
          : undefined;

        const result = await client.agents.list({
          status,
          limit: parseInt(options.limit, 10),
          cursor: options.cursor,
        });

        spinner.stop();

        if (program.opts().output === 'table') {
          console.log(formatAgentTable(result.agents));
          if (result.nextCursor) {
            console.log(`\nNext cursor: ${result.nextCursor}`);
          }
          console.log(`Total: ${result.totalCount}`);
        } else {
          console.log(formatOutput(result, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Failed to fetch agents');
        handleError(err, program.opts().verbose);
      }
    });

  // Info command
  agentCmd
    .command('info <agentId>')
    .description('Get agent details')
    .action(async (agentId: string) => {
      const spinner = ora('Fetching agent...').start();

      try {
        const client = await getClient();
        const result = await client.agents.get(agentId);

        spinner.stop();
        const outputFormat = (program.opts().output || 'table') as 'table' | 'json' | 'yaml';
        console.log(formatAgentDetails(result, outputFormat));
      } catch (err) {
        spinner.fail('Failed to fetch agent');
        handleError(err, program.opts().verbose);
      }
    });

  // Start command
  agentCmd
    .command('start <agentId>')
    .description('Start an agent')
    .action(async (agentId: string) => {
      const spinner = ora('Starting agent...').start();

      try {
        const client = await getClient();
        const result = await client.agents.start(agentId);
        spinner.succeed(`Agent ${formatId(agentId)} started`);
        console.log(`  Status: ${formatStatus(result.status)}`);
      } catch (err) {
        spinner.fail('Failed to start agent');
        handleError(err, program.opts().verbose);
      }
    });

  // Stop command
  agentCmd
    .command('stop <agentId>')
    .description('Stop an agent')
    .option('--force', 'Stop immediately without waiting (graceful=false)')
    .option('--timeout <ms>', 'Timeout in milliseconds', '30000')
    .action(async (agentId: string, options) => {
      const spinner = ora('Stopping agent...').start();

      try {
        const client = await getClient();
        const result = await client.agents.stop(agentId, {
          graceful: !options.force,
          timeoutMs: parseInt(options.timeout, 10),
        });
        spinner.succeed(`Agent ${formatId(agentId)} stopped`);
        console.log(`  Status: ${formatStatus(result.status)}`);
      } catch (err) {
        spinner.fail('Failed to stop agent');
        handleError(err, program.opts().verbose);
      }
    });

  // Logs command
  agentCmd
    .command('logs <agentId>')
    .description('View agent execution logs')
    .option('-f, --follow', 'Stream logs in real-time')
    .option('--since <duration>', 'Show logs since duration (e.g., 1h, 24h, 7d)')
    .option('--tail <n>', 'Number of recent logs to show', '50')
    .action(async (agentId: string, options) => {
      try {
        const client = await getClient();

        if (options.follow) {
          // Streaming logs using watchEvents
          console.log(chalk.dim(`Streaming logs for agent ${formatId(agentId)}...\n`));
          console.log(chalk.dim('Press Ctrl+C to stop\n'));

          try {
            // Use watchEvents for real-time updates
            for await (const event of client.agents.watchEvents(agentId)) {
              const time = new Date(event.timestamp).toLocaleTimeString();
              const level = formatLogLevel('INFO');
              console.log(`${chalk.dim(time)} ${level} [${event.type}] ${event.message || ''}`);
            }
          } catch (err) {
            if (err instanceof Error && err.message.includes('SIGINT')) {
              console.log('\n' + chalk.dim('Stopped watching'));
              process.exit(130);
            }
            throw err;
          }
        } else {
          // One-time fetch
          const spinner = ora('Fetching logs...').start();

          const sinceTimestamp = parseDuration(options.since);

          const logs = await client.agents.getLogs(agentId, {
            limit: parseInt(options.tail, 10),
            after: sinceTimestamp,
          });

          spinner.stop();

          if (logs.entries.length === 0) {
            console.log(chalk.dim('No logs found'));
            return;
          }

          for (const entry of logs.entries) {
            console.log(formatLogEntry(entry));
          }
        }
      } catch (err) {
        handleError(err, program.opts().verbose);
      }
    });

  // Delete command
  agentCmd
    .command('delete <agentId>')
    .description('Delete an agent')
    .option('--force', 'Skip confirmation prompt')
    .action(async (agentId: string, options) => {
      try {
        if (!options.force) {
          const { confirmed } = await prompts({
            type: 'confirm',
            name: 'confirmed',
            message: `Delete agent ${formatId(agentId)}? This cannot be undone.`,
            initial: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }

        const spinner = ora('Deleting agent...').start();
        const client = await getClient();

        // Stop first if running
        try {
          const info = await client.agents.get(agentId);
          if (['RUNNING', 'STARTING'].includes(info.status)) {
            spinner.text = 'Stopping agent...';
            await client.agents.stop(agentId, { graceful: false });
          }
        } catch (err) {
          // Ignore errors when stopping
        }

        spinner.text = 'Deleting agent...';
        await client.agents.delete(agentId);
        spinner.succeed(`Agent ${formatId(agentId)} deleted`);
      } catch (err) {
        handleError(err, program.opts().verbose);
      }
    });
}
