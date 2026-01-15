/**
 * Watch Execution Example
 *
 * Demonstrates how to watch execution status in real-time using SSE.
 *
 * Usage:
 *   1. Start the mock server: bun run --filter @nexwave/mock-server dev
 *   2. Run this example: bun run examples/watch-execution.ts
 */

import { NexwaveClient, IntentBuilder } from '@nexwave/sdk';

async function main() {
  console.log('Nexwave SDK - Watch Execution Example\n');

  // Initialize client
  const client = new NexwaveClient({
    endpoint: 'http://localhost:8080',
    apiKey: process.env.NEXWAVE_API_KEY ?? 'nxw_test_example',
  });

  // Build a simple swap intent
  const intent = new IntentBuilder()
    .exchange()
    .from('USDC', '1000000000', 6) // 1,000 USDC
    .to('SOL', 9)
    .maxSlippage(100) // 1%
    .deadline(120) // 2 minutes
    .label('watch-example')
    .build();

  try {
    // Submit without waiting
    console.log('--- Submitting Intent ---');
    const result = await client.intents.submit(intent);
    console.log('Intent ID:', result.intentId);
    console.log('Initial state:', result.state);

    // Watch the execution in real-time
    console.log('\n--- Watching Execution (real-time) ---');
    const startTime = Date.now();

    for await (const event of client.intents.watchStatus(result.intentId)) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const stateIcon = getStateIcon(event.state);

      console.log(
        `[${elapsed}s] ${stateIcon} ${event.state.padEnd(12)} | ${event.event.message}`
      );

      // Check for terminal state
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(event.state)) {
        console.log('\n--- Execution Complete ---');
        break;
      }
    }

    // Get final status with outcome details
    const finalStatus = await client.intents.getStatus(result.intentId);
    console.log('\nFinal State:', finalStatus.state);

    if (finalStatus.outcome) {
      console.log('Outcome:');
      console.log('  - Success:', finalStatus.outcome.success);
      if (finalStatus.outcome.actualOutput) {
        console.log(
          '  - Output:',
          finalStatus.outcome.actualOutput.amount,
          finalStatus.outcome.actualOutput.asset.symbol
        );
      }
      console.log('  - Fees:', finalStatus.outcome.actualFees);
      console.log('  - Slippage:', finalStatus.outcome.actualSlippageBps, 'bps');
      console.log('  - Transaction:', finalStatus.outcome.transactionId);
    }

    // Show all events
    console.log('\n--- Event History ---');
    for (const event of finalStatus.events) {
      const time = new Date(event.timestamp).toISOString().split('T')[1].split('.')[0];
      console.log(`  [${time}] ${event.type}: ${event.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  await client.close();
}

function getStateIcon(state: string): string {
  switch (state) {
    case 'PENDING':
      return '\u23F3'; // hourglass
    case 'VALIDATING':
      return '\u2713'; // checkmark
    case 'PLANNING':
      return '\uD83D\uDCCB'; // clipboard
    case 'SIMULATING':
      return '\uD83D\uDD2C'; // microscope
    case 'SUBMITTING':
      return '\uD83D\uDE80'; // rocket
    case 'CONFIRMING':
      return '\u231B'; // hourglass done
    case 'VERIFYING':
      return '\uD83D\uDD0D'; // magnifying glass
    case 'COMPLETED':
      return '\u2705'; // green checkmark
    case 'FAILED':
      return '\u274C'; // red X
    case 'CANCELLED':
      return '\u26D4'; // stop sign
    default:
      return '\u2022'; // bullet
  }
}

main().catch(console.error);
