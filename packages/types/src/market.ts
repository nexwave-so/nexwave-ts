import { z } from 'zod';
import { AmountSchema, PriceSchema, TimestampSchema } from './common';
import { AssetSchema } from './intent';

// ─── Venue Type ─────────────────────────────────────────────────────────────

export const VenueTypeSchema = z.enum(['AMM', 'ORDERBOOK', 'HYBRID', 'LENDING']);
export type VenueType = z.infer<typeof VenueTypeSchema>;

// ─── Venue ──────────────────────────────────────────────────────────────────

export const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: VenueTypeSchema,
  chain: z.string(),
  supportedActions: z.array(z.string()),
  available: z.boolean(),
});
export type Venue = z.infer<typeof VenueSchema>;

// ─── Market State ───────────────────────────────────────────────────────────

export const MarketStateSchema = z.object({
  base: AssetSchema,
  quote: AssetSchema,
  bestBid: PriceSchema.optional(),
  bestAsk: PriceSchema.optional(),
  midPrice: PriceSchema,
  liquidityDepth: AmountSchema,
  lastTradePrice: PriceSchema,
  volume24h: AmountSchema,
  priceChange24h: z.number(),
});
export type MarketState = z.infer<typeof MarketStateSchema>;

// ─── Market Event Types ─────────────────────────────────────────────────────

export const MarketEventTypeSchema = z.enum([
  'PRICE_UPDATE',
  'LIQUIDITY_CHANGE',
  'VENUE_DOWN',
  'VENUE_UP',
]);
export type MarketEventType = z.infer<typeof MarketEventTypeSchema>;

// ─── Market Event ───────────────────────────────────────────────────────────

export const MarketEventSchema = z.object({
  asset: AssetSchema,
  type: MarketEventTypeSchema,
  price: PriceSchema.optional(),
  venue: z.string().optional(),
  timestamp: TimestampSchema,
});
export type MarketEvent = z.infer<typeof MarketEventSchema>;

// ─── Market Update (streaming) ──────────────────────────────────────────────

export const MarketUpdateSchema = z.object({
  pair: z.object({
    base: z.string(),
    quote: z.string(),
  }),
  state: MarketStateSchema,
  timestamp: TimestampSchema,
});
export type MarketUpdate = z.infer<typeof MarketUpdateSchema>;

// ─── Adapter ────────────────────────────────────────────────────────────────

export const AdapterSchema = z.object({
  id: z.string(),
  name: z.string(),
  chain: z.string(),
  status: z.enum(['connected', 'disconnected', 'error']),
  latencyMs: z.number().int().optional(),
});
export type Adapter = z.infer<typeof AdapterSchema>;

// ─── Component Health ───────────────────────────────────────────────────────

export const ComponentHealthSchema = z.object({
  name: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  latencyMs: z.number().int().optional(),
});
export type ComponentHealth = z.infer<typeof ComponentHealthSchema>;

// ─── Health Response ────────────────────────────────────────────────────────

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  message: z.string().optional(),
  components: z.record(ComponentHealthSchema).optional(),
  checkedAt: TimestampSchema,
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// ─── Runtime Info ───────────────────────────────────────────────────────────

export const RuntimeInfoSchema = z.object({
  version: z.string(),
  commit: z.string(),
  buildTime: z.string(),
  startedAt: TimestampSchema,
  uptimeSeconds: z.number().int(),
  environment: z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']),
});
export type RuntimeInfo = z.infer<typeof RuntimeInfoSchema>;
