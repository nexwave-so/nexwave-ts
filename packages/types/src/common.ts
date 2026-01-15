import { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────────

/** Amount in smallest token units (e.g., lamports). String to avoid precision loss. */
export const AmountSchema = z.string().regex(/^\d+$/, 'Amount must be a numeric string');
export type Amount = z.infer<typeof AmountSchema>;

/** Price as scaled integer (divide by 1e9 for actual price) */
export const PriceSchema = z.string().regex(/^\d+$/, 'Price must be a numeric string');
export type Price = z.infer<typeof PriceSchema>;

/** Basis points (100 = 1%, max 10000 = 100%) */
export const BpsSchema = z.number().int().min(0).max(10000);
export type Bps = z.infer<typeof BpsSchema>;

/** Unix timestamp in milliseconds */
export const TimestampSchema = z.number().int().positive();
export type Timestamp = z.infer<typeof TimestampSchema>;

/** UUID v4 */
export const UUIDSchema = z.string().uuid();
export type UUID = z.infer<typeof UUIDSchema>;

// ─── Leverage ───────────────────────────────────────────────────────────────

export const LeverageSchema = z.object({
  numerator: z.number().int().min(1).max(100),
  denominator: z.number().int().min(1).max(100),
});
export type Leverage = z.infer<typeof LeverageSchema>;

// ─── Urgency ────────────────────────────────────────────────────────────────

export const UrgencySchema = z.enum(['LOW', 'NORMAL', 'HIGH']);
export type Urgency = z.infer<typeof UrgencySchema>;

// ─── Price Range ────────────────────────────────────────────────────────────

export const PriceRangeSchema = z.object({
  lower: PriceSchema,
  upper: PriceSchema,
});
export type PriceRange = z.infer<typeof PriceRangeSchema>;

// ─── Log Level ──────────────────────────────────────────────────────────────

export const LogLevelSchema = z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

// ─── Health Status ──────────────────────────────────────────────────────────

export const HealthStatusSchema = z.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

// ─── Runtime Environment ────────────────────────────────────────────────────

export const RuntimeEnvironmentSchema = z.enum(['DEVELOPMENT', 'STAGING', 'PRODUCTION']);
export type RuntimeEnvironment = z.infer<typeof RuntimeEnvironmentSchema>;
