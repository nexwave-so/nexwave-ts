import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getClient } from '../lib/client';
import { formatOutput } from '../lib/output';
import { handleError } from '../lib/errors';

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds?: number): string {
  if (!seconds) return '-';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Register system commands
 */
export function registerSystemCommands(program: Command): void {
  const systemCmd = program
    .command('system')
    .description('System health and configuration');

  systemCmd
    .command('health')
    .description('Check system health')
    .option('--detailed', 'Show detailed health information')
    .action(async (options) => {
      const spinner = ora('Checking health...').start();

      try {
        const client = await getClient();
        const health = await client.system.health(options.detailed);

        spinner.stop();

        if (program.opts().output === 'table') {
          const statusIcon = health.status === 'healthy' ? chalk.green('✓') : chalk.red('✗');
          const statusText =
            health.status === 'healthy'
              ? chalk.green('healthy')
              : health.status === 'degraded'
                ? chalk.yellow('degraded')
                : chalk.red('unhealthy');

          console.log('');
          console.log(`  ${statusIcon} System is ${statusText}`);
          console.log('');

          if (health.message) {
            console.log(`  Message:    ${health.message}`);
          }

          if (health.components && Object.keys(health.components).length > 0) {
            console.log('');
            console.log(chalk.bold('  Components'));
            for (const [name, component] of Object.entries(health.components)) {
              const comp = component as any;
              const icon = comp.status === 'healthy' ? chalk.green('✓') : comp.status === 'degraded' ? chalk.yellow('⚠') : chalk.red('✗');
              const statusText =
                comp.status === 'healthy'
                  ? chalk.green('healthy')
                  : comp.status === 'degraded'
                    ? chalk.yellow('degraded')
                    : chalk.red('unhealthy');
              console.log(`    ${icon} ${name}: ${statusText}`);
              if (comp.message) {
                console.log(`      ${chalk.dim(comp.message)}`);
              }
            }
          }

          console.log('');
        } else {
          console.log(formatOutput(health, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Health check failed');
        handleError(err, program.opts().verbose);
      }
    });

  systemCmd
    .command('config')
    .description('Get runtime configuration')
    .action(async () => {
      const spinner = ora('Fetching config...').start();

      try {
        const client = await getClient();
        const config = await client.system.getConfig();

        spinner.stop();
        console.log(formatOutput(config, program.opts().output || 'yaml'));
      } catch (err) {
        spinner.fail('Failed to get config');
        handleError(err, program.opts().verbose);
      }
    });

  systemCmd
    .command('info')
    .description('Get system information')
    .action(async () => {
      const spinner = ora('Fetching info...').start();

      try {
        const client = await getClient();
        const health = await client.system.health();
        const info = await client.system.getInfo();

        spinner.stop();

        console.log('');
        console.log(chalk.bold('Nexwave Runtime'));
        console.log('');
        console.log(`  Endpoint:   ${chalk.cyan(process.env.NEXWAVE_ENDPOINT || 'not set')}`);
        if (info.version) {
          console.log(`  Version:    ${info.version}`);
        }
        if (health.status) {
          const statusColor =
            health.status === 'healthy'
              ? chalk.green
              : health.status === 'degraded'
                ? chalk.yellow
                : chalk.red;
          console.log(`  Status:     ${statusColor(health.status.toUpperCase())}`);
        }
        if (info.uptimeSeconds !== undefined) {
          console.log(`  Uptime:     ${formatUptime(info.uptimeSeconds)}`);
        }
        if (info.environment) {
          console.log(`  Environment: ${info.environment}`);
        }
        console.log('');
      } catch (err) {
        spinner.fail('Failed to get info');
        handleError(err, program.opts().verbose);
      }
    });
}
