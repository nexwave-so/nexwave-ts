import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getClient } from '../lib/client';
import { formatOutput, formatAmountFromSmallest } from '../lib/output';
import { handleError } from '../lib/errors';
import { getDecimals, parseAmount } from '../lib/utils';
import { transformCliIntentToIntent, CliIntentSchema } from '../schemas/intent';

/**
 * Format route for display
 */
function formatRoute(route?: Array<{ venue?: string; pool?: string }>): string {
  if (!route || route.length === 0) return 'direct';
  return route.map((h) => h.venue || h.pool || 'unknown').join(' → ');
}

/**
 * Register market commands
 */
export function registerMarketCommands(program: Command): void {
  const marketCmd = program
    .command('market')
    .description('Market data and quotes');

  marketCmd
    .command('quote')
    .description('Get a swap quote')
    .argument('[from]', 'Input asset symbol')
    .argument('[to]', 'Output asset symbol')
    .argument('[amount]', 'Input amount')
    .option('--from <asset>', 'Input asset (alternative)')
    .option('--to <asset>', 'Output asset (alternative)')
    .option('--amount <amount>', 'Input amount (alternative)')
    .option('--venue <venue>', 'Specific venue to use')
    .action(async (fromArg, toArg, amountArg, options) => {
      const from = fromArg || options.from;
      const to = toArg || options.to;
      const amount = amountArg || options.amount;

      if (!from || !to || !amount) {
        console.error(chalk.red('Usage: nexwave market quote <from> <to> <amount>'));
        process.exit(1);
      }

      const spinner = ora(`Getting quote: ${amount} ${from} → ${to}...`).start();

      try {
        const client = await getClient();

        // Build intent for quote
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
            maxSlippageBps: 10000, // No limit for quote
          },
          urgency: 'NORMAL' as const,
          deadlineSeconds: 60,
        };

        // Validate and transform
        const validation = CliIntentSchema.safeParse(cliIntent);
        if (!validation.success) {
          spinner.fail('Invalid quote parameters');
          validation.error.errors.forEach((err) => {
            console.error(`  • ${err.path.join('.')}: ${err.message}`);
          });
          process.exit(2);
        }

        const intent = transformCliIntentToIntent(validation.data);

        // Get quote
        const result = await client.market.getQuote(intent, options.venue);
        const quote = result.quote;

        spinner.stop();

        if (program.opts().output === 'table') {
          console.log('');
          console.log(chalk.bold('Quote'));
          console.log('');
          console.log(`  Input:        ${chalk.cyan(amount)} ${from.toUpperCase()}`);
          console.log(
            `  Output:       ${chalk.green(
              formatAmountFromSmallest(quote.outputAmount, toDecimals)
            )} ${to.toUpperCase()}`
          );
          console.log(`  Min Output:   ${chalk.dim(formatAmountFromSmallest(quote.minOutput, toDecimals))} ${to.toUpperCase()}`);
          console.log(`  Price:        ${chalk.yellow(quote.price)}`);
          if (quote.cost && quote.cost.priceImpactBps !== undefined) {
            console.log(`  Price Impact: ${chalk.dim(quote.cost.priceImpactBps + ' bps')}`);
          }
          if (quote.route && quote.route.length > 0) {
            console.log(`  Route:        ${formatRoute(quote.route)}`);
          }
          console.log(`  Venue:        ${result.venue || 'auto'}`);
          console.log(
            `  Valid Until:  ${new Date(quote.validUntil).toLocaleTimeString()}`
          );
          console.log('');
        } else {
          console.log(formatOutput(result, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Failed to get quote');
        handleError(err, program.opts().verbose);
      }
    });

  marketCmd
    .command('state')
    .description('Get market state for a pair')
    .argument('<pair>', 'Trading pair (e.g., SOL/USDC or "SOL USDC")')
    .argument('[quote]', 'Quote asset (if pair is split)')
    .option('--venue <venue>', 'Specific venue')
    .action(async (pairOrBase: string, quoteArg?: string, options?: { venue?: string }) => {
      // Parse pair - support "SOL/USDC", "SOL USDC", or separate args
      let base: string, quote: string;

      if (pairOrBase.includes('/')) {
        [base, quote] = pairOrBase.split('/');
      } else if (quoteArg) {
        base = pairOrBase;
        quote = quoteArg;
      } else {
        console.error(
          chalk.red('Usage: nexwave market state SOL/USDC or nexwave market state SOL USDC')
        );
        process.exit(1);
      }

      const spinner = ora(`Fetching ${base}/${quote} market state...`).start();

      try {
        const client = await getClient();
        const result = await client.market.getState(
          base.toUpperCase(),
          quote.toUpperCase(),
          options?.venue
        );

        const state = result.state;
        spinner.stop();

        if (program.opts().output === 'table') {
          console.log('');
          console.log(chalk.bold(`${base.toUpperCase()}/${quote.toUpperCase()} Market State`));
          console.log('');
          if (state.bestBid) {
            console.log(`  Bid:          ${chalk.green(state.bestBid)}`);
          }
          if (state.bestAsk) {
            console.log(`  Ask:          ${chalk.red(state.bestAsk)}`);
          }
          if (state.midPrice) {
            console.log(`  Mid:          ${chalk.yellow(state.midPrice)}`);
          }
          if (state.lastTradePrice) {
            console.log(`  Last Trade:   ${state.lastTradePrice}`);
          }
          if (state.volume24h) {
            console.log(
              `  24h Volume:   ${formatAmountFromSmallest(state.volume24h, getDecimals(quote))} ${quote.toUpperCase()}`
            );
          }
          if (state.liquidityDepth) {
            console.log(
              `  Liquidity:    ${formatAmountFromSmallest(state.liquidityDepth, getDecimals(quote))} ${quote.toUpperCase()}`
            );
          }
          console.log(`  As of:        ${new Date(result.asOf).toLocaleTimeString()}`);
          console.log('');
        } else {
          console.log(formatOutput(result, program.opts().output));
        }
      } catch (err) {
        spinner.fail('Failed to get market state');
        handleError(err, program.opts().verbose);
      }
    });

  marketCmd
    .command('watch')
    .description('Watch price updates')
    .argument('<pair>', 'Trading pair (e.g., SOL/USDC)')
    .option('-i, --interval <seconds>', 'Update interval in seconds', '5')
    .option('--venue <venue>', 'Specific venue')
    .action(async (pair: string, options) => {
      const [base, quote] = pair.split('/');

      if (!base || !quote) {
        console.error(chalk.red('Invalid pair format. Use: SOL/USDC'));
        process.exit(1);
      }

      console.log(chalk.dim(`Watching ${pair} (Ctrl+C to stop)\n`));

      const interval = parseInt(options.interval, 10) * 1000;

      try {
        const client = await getClient();

        while (true) {
          const result = await client.market.getState(
            base.toUpperCase(),
            quote.toUpperCase(),
            options.venue
          );
          const state = result.state;

          const time = new Date().toLocaleTimeString();
          const price = state.midPrice
            ? chalk.yellow(state.midPrice)
            : chalk.dim('N/A');
          const bid = state.bestBid ? chalk.green(state.bestBid) : chalk.dim('-');
          const ask = state.bestAsk ? chalk.red(state.bestAsk) : chalk.dim('-');

          // Clear line and print
          process.stdout.write(
            `\r${chalk.dim(time)} ${pair}: ${price}  Bid: ${bid}  Ask: ${ask}    `
          );

          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      } catch (err) {
        console.log('');
        handleError(err, program.opts().verbose);
      }
    });
}
