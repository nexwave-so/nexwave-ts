import { Command } from 'commander';
import { registerAuthCommands } from './auth';
import { registerConfigCommands } from './config';
import { registerIntentCommands } from './intent';
import { registerIntentShortcuts } from './intent-shortcuts';
import { registerAgentCommands } from './agent';
import { registerMarketCommands } from './market';
import { registerExecutionCommands } from './execution';
import { registerSystemCommands } from './system';
import { generateBashCompletion, generateZshCompletion } from '../completions';

/**
 * Register all commands with the CLI program
 */
export function registerCommands(program: Command): void {
  registerAuthCommands(program);
  registerConfigCommands(program);
  registerIntentCommands(program);
  registerIntentShortcuts(program);
  registerAgentCommands(program);
  registerMarketCommands(program);
  registerExecutionCommands(program);
  registerSystemCommands(program);

  // Completion command
  program
    .command('completion')
    .description('Generate shell completions')
    .argument('<shell>', 'Shell type: bash | zsh')
    .action((shell: string) => {
      switch (shell.toLowerCase()) {
        case 'bash':
          console.log(generateBashCompletion(program));
          break;
        case 'zsh':
          console.log(generateZshCompletion(program));
          break;
        default:
          console.error(`Unknown shell: ${shell}. Supported: bash, zsh`);
          process.exit(1);
      }
    });
}
