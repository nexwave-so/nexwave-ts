import { Command } from 'commander';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import ora from 'ora';
import { getClient } from '../lib/client';
import { formatOutput, success, formatStatus, formatId, formatRelativeTime } from '../lib/output';
import { handleError } from '../lib/errors';
import { parseInput } from '../lib/utils';
import { CliIntentSchema, transformCliIntentToIntent } from '../schemas/intent';
import type { IntentStatus } from '@nexwave/sdk';

/**
 * Format intent status for display
 */
function formatIntentStatus(status: IntentStatus): string {
  const lines = [
    `Intent: ${formatId(status.intentId)}`,
    `Status: ${formatStatus(status.state)}`,
  ];

  if (status.outcome) {
    const outcome = status.outcome;
    lines.push(`Result: ${outcome.success ? '✓ Success' : '✗ Failed'}`);
    if (outcome.actualOutput) {
      lines.push(`Output: ${outcome.actualOutput.amount} ${outcome.actualOutput.asset.symbol}`);
    }
    if (outcome.transactionId) {
      lines.push(`Transaction: ${formatId(outcome.transactionId)}`);
    }
  }

  if (status.events.length > 0) {
    const latestEvent = status.events[status.events.length - 1];
    lines.push(`Latest: ${latestEvent.message}`);
  }

  if (status.createdAt) {
    lines.push(`Created: ${formatRelativeTime(status.createdAt)}`);
  }

  return lines.join('\n');
}

/**
 * Register intent commands
 */
export function registerIntentCommands(program: Command): void {
  const intentCmd = program
    .command('intent')
    .description('Manage execution intents');

  // Submit command
  intentCmd
    .command('submit')
    .description('Submit an intent for execution')
    .option('-f, --file <path>', 'Intent file (YAML or JSON)')
    .option('--json <json>', 'Intent as JSON string')
    .option('-i, --interactive', 'Interactive builder (not yet implemented)')
    .option('--dry-run', 'Validate without submitting')
    .action(async (options) => {
      const spinner = ora('Processing intent...').start();

      try {
        let intentData: unknown;

        // Parse intent from file, JSON, or stdin
        if (options.file) {
          const content = readFileSync(options.file, 'utf-8');
          intentData = options.file.endsWith('.json')
            ? JSON.parse(content)
            : parseYaml(content);
        } else if (options.json) {
          intentData = JSON.parse(options.json);
        } else if (!process.stdin.isTTY) {
          // Read from stdin
          intentData = await parseInput('-');
        } else if (options.interactive) {
          spinner.fail('Interactive mode not yet implemented');
          process.exit(1);
        } else {
          spinner.fail('No intent provided. Use -f, --json, or pipe input');
          process.exit(1);
        }

        // Validate CLI format
        const validation = CliIntentSchema.safeParse(intentData);
        if (!validation.success) {
          spinner.fail('Validation failed');
          console.error('Errors:');
          validation.error.errors.forEach((err) => {
            console.error(`  • ${err.path.join('.')}: ${err.message}`);
          });
          process.exit(2);
        }

        // Transform to SDK format
        const intent = transformCliIntentToIntent(validation.data);

        if (options.dryRun) {
          spinner.succeed('Intent validated successfully');
          console.log(formatOutput(intent, program.opts().output));
          return;
        }

        // Submit
        spinner.text = 'Submitting intent...';
        const client = await getClient();
        const result = await client.intents.submit(intent);

        spinner.succeed('Intent submitted successfully');
        console.log('');
        console.log(success('Intent submitted'));
        console.log(`  ID: ${result.intentId}`);
        console.log(`  Status: ${formatStatus(result.state)}`);
        console.log(`  Track: nexwave intent status ${result.intentId}`);
      } catch (err) {
        spinner.fail('Submission failed');
        handleError(err, program.opts().verbose);
      }
    });

  // Status command
  intentCmd
    .command('status <intentId>')
    .description('Get intent execution status')
    .option('-w, --watch', 'Watch for updates (streaming)')
    .action(async (intentId: string, options) => {
      try {
        const client = await getClient();

        if (options.watch) {
          // Streaming updates
          console.log(`Watching intent ${formatId(intentId)}...\n`);
          console.log('Press Ctrl+C to stop\n');

          let lastStatus: IntentStatus | null = null;
          try {
            for await (const event of client.intents.watchStatus(intentId)) {
              // Get full status on first event
              if (!lastStatus) {
                lastStatus = await client.intents.getStatus(intentId);
              } else {
                // Update status from event
                lastStatus = {
                  ...lastStatus,
                  state: event.state,
                  events: [...lastStatus.events, event.event],
                } as IntentStatus;
              }

              // Clear and redraw
              process.stdout.write('\x1b[2J\x1b[H');
              console.log(formatIntentStatus(lastStatus));
              console.log(`\nLast update: ${new Date().toLocaleTimeString()}`);

              // Stop if terminal state
              if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(event.state)) {
                console.log('\n' + success('Intent reached terminal state'));
                break;
              }
            }
          } catch (err) {
            if (err instanceof Error && err.message.includes('SIGINT')) {
              console.log('\n' + 'Stopped watching');
              process.exit(130);
            }
            throw err;
          }
        } else {
          // Single status check
          const spinner = ora('Fetching status...').start();
          const status = await client.intents.getStatus(intentId);
          spinner.stop();

          console.log(formatIntentStatus(status));
          console.log('');
          console.log(formatOutput(status, program.opts().output));
        }
      } catch (err) {
        handleError(err, program.opts().verbose);
      }
    });

  // List command
  intentCmd
    .command('list')
    .description('List intents')
    .option('-s, --status <status>', 'Filter by status (comma-separated)')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('--after <date>', 'Created after date (ISO or YYYY-MM-DD)')
    .option('--before <date>', 'Created before date (ISO or YYYY-MM-DD)')
    .option('--cursor <cursor>', 'Pagination cursor')
    .action(async (options) => {
      const spinner = ora('Fetching intents...').start();

      try {
        const client = await getClient();

        // Parse status filter
        const states = options.status
          ? options.status.split(',').map((s: string) => s.trim().toUpperCase())
          : undefined;

        // Parse dates
        let after: number | undefined;
        let before: number | undefined;

        if (options.after) {
          const date = new Date(options.after);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${options.after}`);
          }
          after = date.getTime();
        }

        if (options.before) {
          const date = new Date(options.before);
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid date format: ${options.before}`);
          }
          before = date.getTime();
        }

        const result = await client.intents.list({
          limit: parseInt(options.limit, 10),
          cursor: options.cursor,
          states,
          after,
          before,
        });

        spinner.stop();

        // Format output
        if (program.opts().output === 'table') {
          const tableData = result.intents.map((intent) => ({
            ID: formatId(intent.id),
            Action: intent.action,
            Status: formatStatus(intent.state),
            Input: intent.input
              ? `${formatAmountFromSmallest(intent.input.amount, intent.input.asset.decimals)} ${intent.input.asset.symbol}`
              : '-',
            Created: formatRelativeTime(intent.createdAt),
            Label: intent.label || '-',
          }));

          console.log(formatTable(tableData));
          if (result.nextCursor) {
            console.log(`\nNext cursor: ${result.nextCursor}`);
          }
          console.log(`Total: ${result.totalCount}`);
        } else {
          console.log(formatOutput(result, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Failed to fetch intents');
        handleError(err, program.opts().verbose);
      }
    });

  // Cancel command
  intentCmd
    .command('cancel <intentId>')
    .description('Cancel a pending intent')
    .option('--reason <reason>', 'Cancellation reason')
    .action(async (intentId: string, options) => {
      const spinner = ora('Cancelling intent...').start();

      try {
        const client = await getClient();
        const result = await client.intents.cancel(intentId, options.reason);

        if (result.cancelled) {
          spinner.succeed('Intent cancelled');
          console.log(`  Final status: ${formatStatus(result.finalState)}`);
          if (result.message) {
            console.log(`  ${result.message}`);
          }
        } else {
          spinner.warn('Intent could not be cancelled');
          console.log(`  Current status: ${formatStatus(result.finalState)}`);
        }
      } catch (err) {
        spinner.fail('Cancellation failed');
        handleError(err, program.opts().verbose);
      }
    });

  // Validate command
  intentCmd
    .command('validate')
    .description('Validate an intent without submitting')
    .option('-f, --file <path>', 'Intent file (YAML or JSON)')
    .option('--json <json>', 'Intent as JSON string')
    .action(async (options) => {
      const spinner = ora('Validating intent...').start();

      try {
        let intentData: unknown;

        if (options.file) {
          const content = readFileSync(options.file, 'utf-8');
          intentData = options.file.endsWith('.json')
            ? JSON.parse(content)
            : parseYaml(content);
        } else if (options.json) {
          intentData = JSON.parse(options.json);
        } else if (!process.stdin.isTTY) {
          intentData = await parseInput('-');
        } else {
          spinner.fail('No intent provided');
          process.exit(1);
        }

        // Validate CLI format
        const cliValidation = CliIntentSchema.safeParse(intentData);
        if (!cliValidation.success) {
          spinner.fail('Validation failed');
          console.error('Errors:');
          cliValidation.error.errors.forEach((err) => {
            console.error(`  • ${err.path.join('.')}: ${err.message}`);
          });
          process.exit(2);
        }

        // Transform and validate with SDK
        const intent = transformCliIntentToIntent(cliValidation.data);
        const client = await getClient();
        const result = await client.intents.validate(intent);

        if (result.valid) {
          spinner.succeed('Intent is valid');
          if (result.warnings.length > 0) {
            console.log('\nWarnings:');
            result.warnings.forEach((w) => {
              console.log(`  • ${w.field}: ${w.message}`);
            });
          }
        } else {
          spinner.fail('Intent validation failed');
          console.error('Errors:');
          result.errors.forEach((e) => {
            console.error(`  • ${e.field}: ${e.message}`);
          });
          process.exit(2);
        }
      } catch (err) {
        spinner.fail('Validation failed');
        handleError(err, program.opts().verbose);
      }
    });
}

import { formatTable, formatAmountFromSmallest } from '../lib/output';
