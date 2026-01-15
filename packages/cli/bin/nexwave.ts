#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import chalk from 'chalk';
import { registerCommands } from '../src/commands/index';
import { handleError, setupGracefulShutdown } from '../src/lib/errors';
import { getConfigManager } from '../src/lib/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version from package.json
// In bundled output, __dirname is dist/bin, so go up two levels
const packageJsonPath = join(__dirname, '..', '..', 'package.json');
let packageJson: { version: string; name: string };
try {
  packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
} catch {
  // Fallback: try one level up (for development)
  const fallbackPath = join(__dirname, '..', 'package.json');
  packageJson = JSON.parse(readFileSync(fallbackPath, 'utf8'));
}
const version = packageJson.version;
const name = packageJson.name;

const LOGO = `
 _   _                                   
| \\ | | _____  ____      ____ ___   _____ 
|  \\| |/ _ \\ \\/ /\\ \\ /\\ / / _\` \\ \\ / / _ \\
| |\\  |  __/>  <  \\ V  V / (_| |\\ V /  __/
|_| \\_|\\___/_/\\_\\  \\_/\\_/ \\__,_| \\_/ \\___|
`;

/**
 * Main entry point
 */
async function main() {
  // Setup graceful shutdown
  setupGracefulShutdown(async () => {
    // Cleanup if needed
  });

  // Initialize config
  const configPath = process.env.NEXWAVE_CONFIG_PATH;
  if (configPath) {
    getConfigManager(configPath);
  }

  // Create CLI program
  program
    .name('nexwave')
    .description('Nexwave CLI — Deterministic DeFi Execution')
    .configureOutput({
      writeOut: (str) => process.stdout.write(str),
      writeErr: (str) => process.stderr.write(chalk.red(str)),
    })
    .option('-o, --output <format>', 'Output format: table | json | yaml', 'table')
    .option('--verbose', 'Verbose output')
    .option('--quiet', 'Suppress non-essential output')
    .option('--no-color', 'Disable colors')
    .option('--config <path>', 'Config file path')
    .option('--endpoint <url>', 'API endpoint override')
    .option('--key <key>', 'API key override')
    .option('-v, --version', 'Show version number', () => {
      console.log(chalk.cyan(LOGO));
      console.log(chalk.bold(`  ${name} v${version}`));
      console.log(chalk.dim(`  Node ${process.version}`));
      console.log(chalk.dim(`  Platform: ${process.platform}-${process.arch}`));
      console.log('');
      process.exit(0);
    });

  // Register all commands
  registerCommands(program);

  // Parse arguments
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    handleError(err, program.opts().verbose);
  }
}

// Run main
main().catch((err) => {
  handleError(err);
});
