/**
 * Simple Swap Example
 *
 * Demonstrates how to use the Nexwave SDK to execute a simple token swap.
 *
 * Usage:
 *   1. Start the mock server: bun run --filter @nexwave/mock-server dev
 *   2. Run this example: bun run examples/simple-swap.ts
 */

import { NexwaveClient, IntentBuilder } from '@nexwave/sdk';

async function main() {
  console.log('Nexwave SDK - Simple Swap Example\n');

  // Initialize client
  const client = new NexwaveClient({
    endpoint: 'http://localhost:8080',
    apiKey: process.env.NEXWAVE_API_KEY ?? 'nxw_test_example',
  });

  // Build intent using fluent API
  const intent = new IntentBuilder()
    .exchange()
    .from('USDC', '50000000000', 6) // 50,000 USDC
    .to('SOL', 9)
    .maxSlippage(50) // 0.5%
    .maxFee('100000') // 0.0001 SOL
    .deadline(60) // 60 seconds
    .retries(3)
    .label('example-swap')
    .build();

  console.log('Intent:', JSON.stringify(intent, null, 2));

  // Simulate first
  console.log('\n--- Simulating ---');
  try {
    const simulation = await client.intents.simulate(intent);

    if (!simulation.success) {
      console.error('Simulation failed:', simulation.failureReason);
      return;
    }

    console.log('Quote:', {
      output: simulation.quote?.outputAmount,
      minOutput: simulation.quote?.minOutput,
      price: simulation.quote?.price,
      cost: simulation.estimatedCost,
    });

    // Submit for execution
    console.log('\n--- Submitting ---');
    const result = await client.intents.submit(intent);
    console.log('Submitted:', result.intentId, 'State:', result.state);

    // Watch status
    console.log('\n--- Watching status ---');
    for await (const event of client.intents.watchStatus(result.intentId)) {
      console.log(`[${event.state}] ${event.event.message}`);

      if (event.state === 'COMPLETED' || event.state === 'FAILED') {
        break;
      }
    }

    // Get final status
    console.log('\n--- Final Status ---');
    const status = await client.intents.getStatus(result.intentId);
    console.log('Final state:', status.state);
    if (status.outcome) {
      console.log('Outcome:', status.outcome);
    }
  } catch (error) {
    console.error('Error:', error);
  }

  await client.close();
}

main().catch(console.error);
