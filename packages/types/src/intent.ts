import { z } from 'zod';
import {
  AmountSchema,
  LeverageSchema,
  PriceRangeSchema,
  PriceSchema,
  TimestampSchema,
  UrgencySchema,
  UUIDSchema,
} from './common';
import { ConstraintSetSchema } from './constraints';

// ─── Asset ──────────────────────────────────────────────────────────────────

export const AssetSchema = z.object({
  /** Symbol (e.g., "SOL", "USDC") */
  symbol: z.string().min(1).max(20),
  /** Optional on-chain address */
  address: z.string().optional(),
  /** Decimal precision */
  decimals: z.number().int().min(0).max(18),
  /** Optional chain identifier */
  chain: z.string().optional(),
});
export type Asset = z.infer<typeof AssetSchema>;

export const AssetAmountSchema = z.object({
  asset: AssetSchema,
  amount: AmountSchema,
});
export type AssetAmount = z.infer<typeof AssetAmountSchema>;

// ─── Order Side ─────────────────────────────────────────────────────────────

export const OrderSideSchema = z.enum(['BUY', 'SELL']);
export type OrderSide = z.infer<typeof OrderSideSchema>;

// ─── Position Direction ─────────────────────────────────────────────────────

export const PositionDirectionSchema = z.enum(['LONG', 'SHORT', 'NEUTRAL']);
export type PositionDirection = z.infer<typeof PositionDirectionSchema>;

// ─── Action Types ───────────────────────────────────────────────────────────

export const ExchangeActionSchema = z.object({
  type: z.literal('EXCHANGE'),
});

export const LimitOrderActionSchema = z.object({
  type: z.literal('LIMIT_ORDER'),
  limitPrice: PriceSchema,
  side: OrderSideSchema,
});

export const OpenPositionActionSchema = z.object({
  type: z.literal('OPEN_POSITION'),
  leverage: LeverageSchema,
  direction: PositionDirectionSchema,
  range: PriceRangeSchema.optional(),
});

export const ClosePositionActionSchema = z.object({
  type: z.literal('CLOSE_POSITION'),
  positionId: z.string(),
});

export const LendActionSchema = z.object({
  type: z.literal('LEND'),
});

export const WithdrawActionSchema = z.object({
  type: z.literal('WITHDRAW'),
  positionId: z.string(),
});

export const ActionTypeSchema = z.discriminatedUnion('type', [
  ExchangeActionSchema,
  LimitOrderActionSchema,
  OpenPositionActionSchema,
  ClosePositionActionSchema,
  LendActionSchema,
  WithdrawActionSchema,
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

// ─── Intent Metadata ────────────────────────────────────────────────────────

export const IntentMetadataSchema = z.object({
  label: z.string().optional(),
  correlationId: z.string().optional(),
  tags: z.record(z.string()).optional(),
});
export type IntentMetadata = z.infer<typeof IntentMetadataSchema>;

// ─── Intent ─────────────────────────────────────────────────────────────────

export const IntentSchema = z.object({
  id: UUIDSchema.optional(), // Generated if not provided
  action: ActionTypeSchema,
  inputs: z.array(AssetAmountSchema).min(1),
  output: AssetSchema,
  constraints: ConstraintSetSchema,
  urgency: UrgencySchema.default('NORMAL'),
  deadline: TimestampSchema,
  metadata: IntentMetadataSchema.optional(),
});
export type Intent = z.infer<typeof IntentSchema>;

// ─── Execution State ────────────────────────────────────────────────────────

export const ExecutionStateSchema = z.enum([
  'PENDING',
  'VALIDATING',
  'PLANNING',
  'SIMULATING',
  'SUBMITTING',
  'CONFIRMING',
  'VERIFYING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'RETRYING',
]);
export type ExecutionState = z.infer<typeof ExecutionStateSchema>;
