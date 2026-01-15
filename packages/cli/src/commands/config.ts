import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { getConfigManager } from '../lib/config';
import { formatOutput } from '../lib/output';
import { handleError } from '../lib/errors';

/**
 * Print config tree recursively
 */
function printConfigTree(obj: any, prefix = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(chalk.dim(fullKey + ':'));
      printConfigTree(value, fullKey);
    } else {
      console.log(`  ${chalk.cyan(fullKey)} = ${chalk.yellow(JSON.stringify(value))}`);
    }
  }
}

/**
 * Register config commands
 */
export function registerConfigCommands(program: Command): void {
  const configCmd = program
    .command('config')
    .description('Manage CLI configuration');

  configCmd
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      try {
        const config = getConfigManager();

        // Parse value (handle booleans and numbers)
        let parsed: any = value;
        if (value === 'true') parsed = true;
        else if (value === 'false') parsed = false;
        else if (/^\d+$/.test(value)) parsed = parseInt(value, 10);
        else if (/^\d+\.\d+$/.test(value)) parsed = parseFloat(value);

        config.set(key, parsed);
        console.log(chalk.green('✓') + ` Set ${chalk.cyan(key)} = ${chalk.yellow(JSON.stringify(parsed))}`);
      } catch (err) {
        handleError(err);
      }
    });

  configCmd
    .command('get <key>')
    .description('Get a configuration value')
    .action(async (key: string) => {
      try {
        const config = getConfigManager();
        const value = config.get(key);

        if (value === undefined) {
          console.log(chalk.dim(`${key} is not set`));
        } else {
          console.log(`${chalk.cyan(key)} = ${chalk.yellow(JSON.stringify(value))}`);
        }
      } catch (err) {
        handleError(err);
      }
    });

  configCmd
    .command('list')
    .description('List all configuration')
    .action(async () => {
      try {
        const config = getConfigManager();
        const all = config.getAll();
        const format = program.opts().output;

        if (format === 'json' || format === 'yaml') {
          console.log(formatOutput(all, format));
        } else {
          console.log(chalk.bold('\nCLI Configuration\n'));
          printConfigTree(all);
          console.log('');
        }
      } catch (err) {
        handleError(err);
      }
    });

  configCmd
    .command('reset')
    .description('Reset configuration to defaults')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      try {
        if (!options.force) {
          const { confirmed } = await prompts({
            type: 'confirm',
            name: 'confirmed',
            message: 'Reset all configuration to defaults?',
            initial: false,
          });

          if (!confirmed) {
            console.log(chalk.dim('Cancelled'));
            return;
          }
        }

        const config = getConfigManager();
        config.reset();
        console.log(chalk.green('✓') + ' Configuration reset to defaults');
      } catch (err) {
        handleError(err);
      }
    });
}
