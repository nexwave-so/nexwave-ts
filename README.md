<div align="center">

# Nexwave SDK

**The TypeScript SDK for autonomous DeFi execution**

[![npm version](https://img.shields.io/npm/v/@nexwave/sdk.svg?style=flat-square&color=00CBF9)](https://www.npmjs.com/package/@nexwave/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-f9f1e1?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)

[Documentation](https://docs.nexwave.io) · [API Reference](https://docs.nexwave.io/api) · [Examples](./examples) · [Discord](https://discord.gg/nexwave)

</div>

---

## What is Nexwave?

Nexwave is a **deterministic execution kernel** for DeFi. It converts economic intent into verified on-chain action.

This SDK provides:

- 🎯 **Intent-based execution** — Describe *what* you want, not *how* to get it
- 🔒 **Constraint enforcement** — Slippage limits, fee caps, retry policies
- 🤖 **Agent management** — Deploy autonomous trading agents
- 📡 **Real-time streaming** — Watch execution as it happens
- 🛡️ **Type safety** — Full TypeScript support with Zod validation

---

## Installation

```bash
# Using bun (recommended)
bun add @nexwave/sdk

# Using npm
npm install @nexwave/sdk

# Using yarn
yarn add @nexwave/sdk

# Using pnpm
pnpm add @nexwave/sdk
```

---

## Quick Start

```typescript
import { NexwaveClient, IntentBuilder } from '@nexwave/sdk';

// Initialize client
const client = new NexwaveClient({
  endpoint: 'https://api.nexwave.io',
  apiKey: process.env.NEXWAVE_API_KEY!,
});

// Build an intent using the fluent API
const intent = new IntentBuilder()
  .exchange()                          // Market swap
  .from('USDC', '50000000000', 6)      // 50,000 USDC
  .to('SOL', 9)                        // → SOL
  .maxSlippage(50)                     // 0.5% max slippage
  .maxFee('100000')                    // Max fee in lamports
  .deadline(60)                        // 60 second deadline
  .build();

// Simulate first
const simulation = await client.intents.simulate(intent);
console.log(`Expected output: ${simulation.quote?.outputAmount} SOL`);

// Execute
const result = await client.intents.submit(intent);
console.log(`Intent ID: ${result.intentId}`);

// Watch execution in real-time
for await (const event of client.intents.watchStatus(result.intentId)) {
  console.log(`[${event.state}] ${event.event.message}`);
  
  if (event.state === 'COMPLETED') {
    console.log('✓ Execution successful!');
    break;
  }
  
  if (event.state === 'FAILED') {
    console.error('✗ Execution failed:', event.event.message);
    break;
  }
}
```

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@nexwave/sdk`](./packages/sdk) | Main SDK client | [![npm](https://img.shields.io/npm/v/@nexwave/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@nexwave/sdk) |
| [`@nexwave/types`](./packages/types) | Type definitions | [![npm](https://img.shields.io/npm/v/@nexwave/types.svg?style=flat-square)](https://www.npmjs.com/package/@nexwave/types) |
| [`@nexwave/mock-server`](./packages/mock-server) | Dev mock server | [![npm](https://img.shields.io/npm/v/@nexwave/mock-server.svg?style=flat-square)](https://www.npmjs.com/package/@nexwave/mock-server) |
| [`@nexwave/cli`](./packages/cli) | CLI tool | [![npm](https://img.shields.io/npm/v/@nexwave/cli.svg?style=flat-square)](https://www.npmjs.com/package/@nexwave/cli) |

---

## Features

### Intent Builder

Fluent API for constructing intents:

```typescript
// Market swap
const swap = new IntentBuilder()
  .exchange()
  .from('USDC', '1000000000', 6)
  .to('SOL', 9)
  .maxSlippage(100)
  .deadline(60)
  .build();

// Limit order
const limit = new IntentBuilder()
  .limitOrder('buy', '95000000000')  // Buy at 95 USDC/SOL
  .from('USDC', '10000000000', 6)
  .to('SOL', 9)
  .deadline(3600)
  .build();

// Leveraged position
const position = new IntentBuilder()
  .openPosition('long')
  .from('SOL', '5000000000', 9)
  .to('SOL-USDC-LP', 9)
  .leverage(3)
  .range('90000000000', '110000000000')
  .stopLoss('85000000000')
  .takeProfit('120000000000')
  .deadline(60)
  .build();
```

### Agent Management

Deploy autonomous agents:

```typescript
import { AgentConfigBuilder } from '@nexwave/sdk';

// DCA agent: buy SOL every hour
const config = new AgentConfigBuilder()
  .withIntent(intent)
  .everyHour()
  .maxExecutionsPerDay(24)
  .maxDailyNotional('240000000')
  .circuitBreaker(3)  // Stop after 3 consecutive failures
  .build();

const agent = await client.agents.create({
  name: 'dca-sol-hourly',
  config,
  startImmediately: true,
});

// Watch agent events
for await (const event of client.agents.watchEvents(agent.id)) {
  console.log(`[${event.type}] ${event.message}`);
}
```

### Error Handling

Structured errors with retry information:

```typescript
import { 
  NexwaveError, 
  ValidationError, 
  ExecutionError,
  RateLimitError 
} from '@nexwave/sdk';

try {
  await client.intents.submit(intent);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid intent:', error.errors);
  } else if (error instanceof ExecutionError) {
    console.error(`Execution failed at ${error.state}:`, error.message);
    if (error.retryable) {
      // Retry logic
    }
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfterMs}ms`);
  }
}
```

---

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18 (optional, for npm compatibility)

### Setup

```bash
# Clone the repository
git clone https://github.com/nexwave-io/nexwave-ts.git
cd nexwave-ts

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test

# Type check
bun run typecheck
```

### Local Development

Start the mock server for local development:

```bash
# Terminal 1: Start mock server
bun run --filter @nexwave/mock-server dev

# Terminal 2: Run examples
bun run examples/simple-swap.ts
```

---

## API Reference

### NexwaveClient

```typescript
const client = new NexwaveClient({
  endpoint: string;      // Runtime API endpoint
  apiKey: string;        // API key (starts with nxw_)
  transport?: 'rest';    // Transport type (default: 'rest')
  timeout?: number;      // Request timeout in ms (default: 30000)
  retries?: number;      // Retry count (default: 3)
  debug?: boolean;       // Enable debug logging
});
```

### Services

| Service | Methods |
|---------|---------|
| `client.intents` | `submit`, `simulate`, `validate`, `getStatus`, `cancel`, `list`, `watchStatus` |
| `client.agents` | `create`, `get`, `update`, `start`, `stop`, `delete`, `list`, `getLogs`, `getMetrics`, `watchEvents` |
| `client.execution` | `kill`, `pause`, `resume`, `getQueueStatus`, `getGlobalMetrics` |
| `client.market` | `getState`, `getQuote`, `watchMarket`, `listVenues`, `listAssets` |
| `client.system` | `health`, `getInfo`, `getConfig`, `updateConfig`, `listAdapters` |

---

## Examples

See the [`examples/`](./examples) directory for complete examples:

- [`simple-swap.ts`](./examples/simple-swap.ts) — Basic token swap
- [`create-agent.ts`](./examples/create-agent.ts) — Deploy an autonomous agent
- [`watch-execution.ts`](./examples/watch-execution.ts) — Stream execution events

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## Security

For security issues, please see [SECURITY.md](./SECURITY.md).

---

## License

MIT © [Nexwave](https://nexwave.io)

---

<div align="center">

**[Website](https://nexwave.io)** · **[Documentation](https://docs.nexwave.io)** · **[Twitter](https://twitter.com/nexwave_io)** · **[Discord](https://discord.gg/nexwave)**

</div>
