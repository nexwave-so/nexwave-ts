# @nexwave/sdk

The official TypeScript SDK for the Nexwave Runtime API.

## Installation

```bash
bun add @nexwave/sdk
```

## Usage

```typescript
import { NexwaveClient, IntentBuilder } from '@nexwave/sdk';

const client = new NexwaveClient({
  endpoint: 'https://api.nexwave.io',
  apiKey: 'nxw_live_xxxx',
});

const intent = new IntentBuilder()
  .exchange()
  .from('USDC', '50000000000', 6)
  .to('SOL', 9)
  .maxSlippage(50)
  .deadline(60)
  .build();

const result = await client.intents.submit(intent);
```

See the [main README](../../README.md) for full documentation.

## License

MIT
