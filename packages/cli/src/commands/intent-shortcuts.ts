import { Command } from 'commander';
import ora from 'ora';
import { getClient } from '../lib/client';
import { success, formatStatus } from '../lib/output';
import { handleError } from '../lib/errors';
import { parseAmount, getDecimals } from '../lib/utils';
import { transformCliIntentToIntent, CliIntentSchema } from '../schemas/intent';

/**
 * Register quick shortcut commands (swap, limit)
 */
export function registerIntentShortcuts(program: Command): void {
  // Quick swap command
  program
    .command('swap <from> <to> <amount>')
    .description('Quick market swap')
    .option('--slippage <bps>', 'Max slippage in basis points', '50')
    .option('--urgency <level>', 'Execution urgency', 'NORMAL')
    .option('--deadline <seconds>', 'Deadline in seconds', '60')
    .action(async (from: string, to: string, amount: string, options) => {
      const spinner = ora(`Swapping ${amount} ${from} → ${to}...`).start();

      try {
        const client = await getClient();

        // Build intent
        const fromDecimals = getDecimals(from);
        const toDecimals = getDecimals(to);
        const amountSmallest = parseAmount(amount, from);

        const cliIntent = {
          action: { type: 'EXCHANGE' as const },
          inputs: [
            {
              symbol: from.toUpperCase(),
              amount: amountSmallest,
              decimals: fromDecimals,
            },
          ],
          output: {
            symbol: to.toUpperCase(),
            decimals: toDecimals,
          },
          constraints: {
            maxSlippageBps: parseInt(options.slippage, 10),
          },
          urgency: options.urgency.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH',
          deadlineSeconds: parseInt(options.deadline, 10),
        };

        // Validate
        const validation = CliIntentSchema.safeParse(cliIntent);
        if (!validation.success) {
          spinner.fail('Invalid swap parameters');
          validation.error.errors.forEach((err) => {
            console.error(`  • ${err.path.join('.')}: ${err.message}`);
          });
          process.exit(2);
        }

        // Transform and submit
        const intent = transformCliIntentToIntent(validation.data);
        const result = await client.intents.submit(intent);

        spinner.succeed('Swap submitted');
        console.log('');
        console.log(success('Swap submitted'));
        console.log(`  ID: ${result.intentId}`);
        console.log(`  Status: ${formatStatus(result.state)}`);
        console.log(`  Track: nexwave intent status ${result.intentId}`);
      } catch (err) {
        spinner.fail('Swap failed');
        handleError(err, program.opts().verbose);
      }
    });

  // Quick limit order command
  program
    .command('limit <side> <symbol> <amount>')
    .description('Quick limit order')
    .option('--price <price>', 'Limit price (required)')
    .option('--from <symbol>', 'From asset (for BUY orders)', 'USDC')
    .option('--to <symbol>', 'To asset (for SELL orders)', 'USDC')
    .option('--slippage <bps>', 'Max slippage in basis points', '50')
    .option('--urgency <level>', 'Execution urgency', 'NORMAL')
    .action(async (side: string, symbol: string, amount: string, options) => {
      const spinner = ora(`Creating limit ${side} order...`).start();

      try {
        if (!options.price) {
          spinner.fail('Limit price is required (--price)');
          process.exit(1);
        }

        const client = await getClient();

        const orderSide = side.toUpperCase();
        if (orderSide !== 'BUY' && orderSide !== 'SELL') {
          spinner.fail('Side must be BUY or SELL');
          process.exit(1);
        }

        // Build intent
        const inputSymbol = orderSide === 'BUY' ? options.from : symbol;
        const outputSymbol = orderSide === 'BUY' ? symbol : options.to;
        const inputDecimals = getDecimals(inputSymbol);
        const outputDecimals = getDecimals(outputSymbol);
        const amountSmallest = parseAmount(amount, inputSymbol);

        // Convert price to smallest units (price is typically in human-readable format)
        // For limit orders, price is usually in output asset per input asset
        // We'll store it as a string representing the scaled price
        const priceScaled = Math.floor(parseFloat(options.price) * 1e9).toString();

        const cliIntent = {
          action: {
            type: 'LIMIT_ORDER' as const,
            side: orderSide as 'BUY' | 'SELL',
            limitPrice: priceScaled,
          },
          inputs: [
            {
              symbol: inputSymbol.toUpperCase(),
              amount: amountSmallest,
              decimals: inputDecimals,
            },
          ],
          output: {
            symbol: outputSymbol.toUpperCase(),
            decimals: outputDecimals,
          },
          constraints: {
            maxSlippageBps: parseInt(options.slippage, 10),
          },
          urgency: options.urgency.toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH',
          deadlineSeconds: 3600, // Limit orders typically have longer deadlines
        };

        // Validate
        const validation = CliIntentSchema.safeParse(cliIntent);
        if (!validation.success) {
          spinner.fail('Invalid limit order parameters');
          validation.error.errors.forEach((err) => {
            console.error(`  • ${err.path.join('.')}: ${err.message}`);
          });
          process.exit(2);
        }

        // Transform and submit
        const intent = transformCliIntentToIntent(validation.data);
        const result = await client.intents.submit(intent);

        spinner.succeed('Limit order submitted');
        console.log('');
        console.log(success('Limit order submitted'));
        console.log(`  ID: ${result.intentId}`);
        console.log(`  Status: ${formatStatus(result.state)}`);
        console.log(`  Track: nexwave intent status ${result.intentId}`);
      } catch (err) {
        spinner.fail('Limit order failed');
        handleError(err, program.opts().verbose);
      }
    });
}
