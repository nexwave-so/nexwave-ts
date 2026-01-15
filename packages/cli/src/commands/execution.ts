import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { getClient } from '../lib/client';
import { formatOutput, formatStatus, formatId } from '../lib/output';
import { handleError } from '../lib/errors';

/**
 * Register execution commands
 */
export function registerExecutionCommands(program: Command): void {
  const executionCmd = program
    .command('execution')
    .alias('exec')
    .description('Monitor and control executions');

  executionCmd
    .command('queue')
    .description('View execution queue status')
    .action(async () => {
      const spinner = ora('Fetching queue...').start();

      try {
        const client = await getClient();
        const queue = await client.execution.getQueueStatus();

        spinner.stop();

        if (program.opts().output === 'table') {
          console.log('');
          console.log(chalk.bold('Execution Queue'));
          console.log('');
          console.log(`  Pending Intents:    ${chalk.yellow(queue.pendingIntents.toString())}`);
          console.log(`  Executing Intents:  ${chalk.cyan(queue.executingIntents.toString())}`);
          console.log(`  Running Agents:      ${chalk.green(queue.runningAgents.toString())}`);
          if (queue.paused) {
            console.log(`  Status:              ${chalk.red('PAUSED')}`);
            if (queue.pausedAt) {
              console.log(`  Paused At:          ${new Date(queue.pausedAt).toLocaleString()}`);
            }
          } else {
            console.log(`  Status:              ${chalk.green('RUNNING')}`);
          }
          console.log('');
        } else {
          console.log(formatOutput(queue, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Failed to get queue');
        handleError(err, program.opts().verbose);
      }
    });

  executionCmd
    .command('metrics')
    .description('Get global execution metrics')
    .action(async () => {
      const spinner = ora('Fetching metrics...').start();

      try {
        const client = await getClient();
        const metrics = await client.execution.getGlobalMetrics();

        spinner.stop();

        if (program.opts().output === 'table') {
          console.log('');
          console.log(chalk.bold('Global Execution Metrics'));
          console.log('');
          console.log(`  Total Executions:     ${metrics.totalExecutions}`);
          console.log(`  Successful:           ${chalk.green(metrics.successfulExecutions)}`);
          console.log(`  Failed:               ${chalk.red(metrics.failedExecutions)}`);
          console.log(`  Avg Execution Time:    ${metrics.avgExecutionTimeMs}ms`);
          console.log(`  Total Notional:       ${metrics.totalNotional}`);
          console.log(`  Total Fees Paid:      ${metrics.totalFeesPaid}`);
          console.log('');
        } else {
          console.log(formatOutput(metrics, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Failed to get metrics');
        handleError(err, program.opts().verbose);
      }
    });

  executionCmd
    .command('kill')
    .description('Emergency kill switch - stop all executions')
    .option('-r, --reason <reason>', 'Kill reason', 'Manual kill from CLI')
    .option('--agent <agentId>', 'Kill only specific agent')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      try {
        if (!options.force) {
          const { confirmed } = await prompts({
            type: 'confirm',
            name: 'confirmed',
            message: options.agent
              ? `Kill executions for agent ${options.agent}?`
              : 'Kill ALL executions? This is a dangerous operation.',
            initial: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }

        const spinner = ora('Killing executions...').start();
        const client = await getClient();

        const result = await client.execution.kill(options.reason, options.agent);

        spinner.succeed('Executions killed');
        console.log('');
        console.log(`  Executions killed: ${chalk.red(result.executionsKilled.toString())}`);
        console.log(`  Agents stopped:    ${chalk.red(result.agentsStopped.toString())}`);
        console.log(`  Killed at:         ${new Date(result.killedAt).toLocaleString()}`);
        if (result.reason) {
          console.log(`  Reason:            ${result.reason}`);
        }
        console.log('');
      } catch (err) {
        handleError(err, program.opts().verbose);
      }
    });

  executionCmd
    .command('pause')
    .description('Pause all executions')
    .action(async () => {
      const spinner = ora('Pausing executions...').start();

      try {
        const client = await getClient();
        const result = await client.execution.pause();

        spinner.succeed('Executions paused');
        console.log(`  Paused at: ${new Date(result.pausedAt).toLocaleString()}`);
      } catch (err) {
        spinner.fail('Failed to pause executions');
        handleError(err, program.opts().verbose);
      }
    });

  executionCmd
    .command('resume')
    .description('Resume executions')
    .action(async () => {
      const spinner = ora('Resuming executions...').start();

      try {
        const client = await getClient();
        const result = await client.execution.resume();

        spinner.succeed('Executions resumed');
        if (result.resumedAt) {
          console.log(`  Resumed at: ${new Date(result.resumedAt).toLocaleString()}`);
        }
      } catch (err) {
        spinner.fail('Failed to resume executions');
        handleError(err, program.opts().verbose);
      }
    });
}
