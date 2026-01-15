import { Command } from 'commander';
import prompts from 'prompts';
import ora from 'ora';
import { getCredentialManager, validateApiKey, getCredentials } from '../lib/credentials';
import { getClient, clearClient } from '../lib/client';
import { success, error, info, warning } from '../lib/output';
import { handleError } from '../lib/errors';

/**
 * Register auth commands
 */
export function registerAuthCommands(program: Command): void {
  const authCmd = program
    .command('auth')
    .description('Manage authentication credentials');

  // Login command
  authCmd
    .command('login')
    .description('Authenticate with Nexwave API')
    .option('-e, --endpoint <url>', 'API endpoint')
    .option('-k, --key <api-key>', 'API key')
    .action(async (options) => {
      try {
        const manager = getCredentialManager();
        let endpoint = options.endpoint;
        let apiKey = options.key;

        // Interactive prompts if not provided
        if (!endpoint || !apiKey) {
          const response = await prompts([
            {
              type: 'text',
              name: 'endpoint',
              message: 'API Endpoint:',
              initial: endpoint || 'https://api.nexwave.so',
              validate: (value) => {
                try {
                  new URL(value);
                  return true;
                } catch {
                  return 'Invalid URL';
                }
              },
            },
            {
              type: 'password',
              name: 'apiKey',
              message: 'API Key:',
              validate: (value) => {
                if (!value) return 'API key is required';
                if (!validateApiKey(value)) {
                  return 'API key must start with "nxw_"';
                }
                return true;
              },
            },
          ]);

          if (!response.endpoint || !response.apiKey) {
            console.error(error('Authentication cancelled'));
            process.exit(1);
          }

          endpoint = response.endpoint;
          apiKey = response.apiKey;
        }

        // Validate API key format
        if (!validateApiKey(apiKey)) {
          console.error(error('Invalid API key format'));
          console.error(info('API keys must start with "nxw_"'));
          process.exit(1);
        }

        // Validate endpoint URL
        try {
          new URL(endpoint);
        } catch {
          console.error(error('Invalid endpoint URL'));
          process.exit(1);
        }

        // Test connection
        const spinner = ora('Testing connection...').start();
        try {
          const client = await getClient({ endpoint, apiKey });
          await client.health();
          spinner.succeed('Connection successful');
        } catch (err) {
          spinner.fail('Connection failed');
          throw err;
        }

        // Store credentials
        await manager.store(endpoint, apiKey);
        console.log(success('Authentication successful'));
        console.log(info(`Endpoint: ${endpoint}`));
        console.log(info(`API Key: ${apiKey.substring(0, 10)}...`));
      } catch (err) {
        handleError(err);
      }
    });

  // Logout command
  authCmd
    .command('logout')
    .description('Clear stored credentials')
    .action(async () => {
      try {
        const manager = getCredentialManager();
        await manager.clear();
        clearClient();
        console.log(success('Logged out successfully'));
      } catch (err) {
        handleError(err);
      }
    });

  // Status command
  authCmd
    .command('status')
    .description('Check authentication status')
    .action(async () => {
      try {
        const creds = await getCredentials();
        
        if (!creds) {
          console.log(warning('Not authenticated'));
          console.log(info('Run "nexwave auth login" to authenticate'));
          process.exit(1);
        }

        // Test connection
        const spinner = ora('Testing connection...').start();
        try {
          const client = await getClient();
          const health = await client.health();
          spinner.succeed('Authenticated and connected');
          
          console.log('');
          console.log(info('Endpoint:') + ` ${creds.endpoint}`);
          console.log(info('API Key:') + ` ${creds.apiKey.substring(0, 10)}...${creds.apiKey.substring(creds.apiKey.length - 4)}`);
          
          if (health.status === 'healthy') {
            console.log(success(`Status: ${health.status}`));
          } else {
            console.log(warning(`Status: ${health.status}`));
          }
        } catch (err) {
          spinner.fail('Connection failed');
          throw err;
        }
      } catch (err) {
        handleError(err);
      }
    });
}
