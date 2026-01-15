# @nexwave/types

Type definitions and Zod schemas for the Nexwave Runtime API.

## Installation

```bash
bun add @nexwave/types
```

## Usage

```typescript
import { 
  Intent, 
  IntentSchema, 
  Asset, 
  ConstraintSet,
  ExecutionState 
} from '@nexwave/types';

// Validate an intent
const result = IntentSchema.safeParse(unknownData);
if (result.success) {
  const intent: Intent = result.data;
}
```

## Types

- `Intent`, `IntentSchema` — Intent definition
- `Asset`, `AssetAmount` — Asset types
- `ConstraintSet` — Execution constraints
- `ActionType` — Exchange, LimitOrder, OpenPosition, etc.
- `ExecutionState` — Execution lifecycle states
- `Agent`, `AgentConfig` — Agent definitions

## License

MIT
