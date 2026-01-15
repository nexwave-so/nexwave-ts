import { z } from 'zod';
import { AmountSchema, BpsSchema, PriceSchema } from './common';

// ─── Retry Policy ───────────────────────────────────────────────────────────

export const RetryPolicySchema = z.object({
  maxRetries: z.number().int().min(0).max(10).default(3),
  backoffMs: z.number().int().min(0).default(500),
  backoffMultiplier: z.number().min(1).max(5).default(2),
});
export type RetryPolicy = z.infer<typeof RetryPolicySchema>;

// ─── Price Limit ────────────────────────────────────────────────────────────

export const PriceLimitSchema = z.object({
  maxPrice: PriceSchema.optional(),
  minPrice: PriceSchema.optional(),
});
export type PriceLimit = z.infer<typeof PriceLimitSchema>;

// ─── Constraint Set ─────────────────────────────────────────────────────────

export const ConstraintSetSchema = z.object({
  /** Maximum acceptable slippage in basis points */
  maxSlippageBps: BpsSchema.default(100),
  /** Maximum total fees */
  maxFee: AmountSchema.optional(),
  /** Maximum notional value */
  maxNotional: AmountSchema.optional(),
  /** Minimum output amount */
  minOutput: AmountSchema.optional(),
  /** Retry behavior */
  retryPolicy: RetryPolicySchema.default({}),
  /** Price limits */
  priceLimit: PriceLimitSchema.optional(),
  /** Stop loss price */
  stopLoss: PriceSchema.optional(),
  /** Take profit price */
  takeProfit: PriceSchema.optional(),
});
export type ConstraintSet = z.infer<typeof ConstraintSetSchema>;
