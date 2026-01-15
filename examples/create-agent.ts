/**
 * Create Agent Example
 *
 * Demonstrates how to create and manage an agent using the Nexwave SDK.
 *
 * Usage:
 *   1. Start the mock server: bun run --filter @nexwave/mock-server dev
 *   2. Run this example: bun run examples/create-agent.ts
 */

import { NexwaveClient, IntentBuilder, AgentConfigBuilder } from '@nexwave/sdk';

async function main() {
  console.log('Nexwave SDK - Create Agent Example\n');

  // Initialize client
  const client = new NexwaveClient({
    endpoint: 'http://localhost:8080',
    apiKey: process.env.NEXWAVE_API_KEY ?? 'nxw_test_example',
  });

  // Build intent template
  const intentTemplate = new IntentBuilder()
    .exchange()
    .from('USDC', '10000000', 6) // 10 USDC
    .to('SOL', 9)
    .maxSlippage(100) // 1%
    .deadline(60)
    .build();

  // Build agent config using builder
  const agentConfig = new AgentConfigBuilder()
    .withIntent(intentTemplate)
    .everyHour()
    .maxExecutionsPerDay(24)
    .maxDailyNotional('240000000') // 240 USDC
    .circuitBreaker(3)
    .onPriceBelow('SOL', '90000000000', 9) // Trigger if SOL < $90
    .build();

  console.log('Agent Config:', JSON.stringify(agentConfig, null, 2));

  try {
    // Create agent
    console.log('\n--- Creating Agent ---');
    const agent = await client.agents.create({
      name: 'dca-agent',
      config: agentConfig,
      startImmediately: false,
    });
    console.log('Created agent:', agent.id, 'Status:', agent.status);

    // Start agent
    console.log('\n--- Starting Agent ---');
    const startedAgent = await client.agents.start(agent.id);
    console.log('Started agent:', startedAgent.id, 'Status:', startedAgent.status);

    // List agents
    console.log('\n--- Listing Agents ---');
    const agents = await client.agents.list();
    console.log('Total agents:', agents.totalCount);
    for (const a of agents.agents) {
      console.log(`  - ${a.name} (${a.id}): ${a.status}`);
    }

    // Get agent logs
    console.log('\n--- Agent Logs ---');
    const logs = await client.agents.getLogs(agent.id, { limit: 10 });
    for (const entry of logs.entries) {
      console.log(`  [${entry.level}] ${entry.message}`);
    }

    // Get agent metrics
    console.log('\n--- Agent Metrics ---');
    const metrics = await client.agents.getMetrics(agent.id, {
      from: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
      to: Date.now(),
    });
    console.log('Metrics:', metrics);

    // Stop agent
    console.log('\n--- Stopping Agent ---');
    const stoppedAgent = await client.agents.stop(agent.id);
    console.log('Stopped agent:', stoppedAgent.id, 'Status:', stoppedAgent.status);

    // Delete agent
    console.log('\n--- Deleting Agent ---');
    await client.agents.delete(agent.id);
    console.log('Agent deleted');
  } catch (error) {
    console.error('Error:', error);
  }

  await client.close();
}

main().catch(console.error);
