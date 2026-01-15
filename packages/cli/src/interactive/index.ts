import React from 'react';
import { render } from 'ink';
import { App } from './App';
import { getClient } from '../lib/client';
import { getCredentials } from '../lib/credentials';
import { warning, info } from '../lib/output';
import chalk from 'chalk';

export async function startInteractiveMode(): Promise<void> {
  // Check auth first
  const creds = await getCredentials();
  if (!creds) {
    console.error(chalk.yellow('⚠ Not authenticated'));
    console.error(chalk.blue('ℹ Run: nexwave auth login'));
    process.exit(1);
  }

  // Initialize client
  let client;
  try {
    client = await getClient();
  } catch (err) {
    console.error(chalk.yellow('⚠ Cannot connect to Nexwave'));
    console.error(chalk.blue('ℹ Check your endpoint and API key'));
    process.exit(1);
  }

  // Check health
  try {
    await client.system.health();
  } catch (error) {
    console.error(chalk.yellow('⚠ Cannot reach Nexwave server'));
    console.error(chalk.blue('ℹ Check your endpoint and network connection'));
    process.exit(1);
  }

  // Launch Ink app
  const { waitUntilExit } = render(React.createElement(App, { client }));
  await waitUntilExit();
}
