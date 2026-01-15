import { z } from 'zod';
import { AmountSchema, BpsSchema, TimestampSchema, UUIDSchema } from './common';
import { AssetAmountSchema, ExecutionStateSchema } from './intent';

// ─── Execution Stage ────────────────────────────────────────────────────────

export const ExecutionStageSchema = z.enum([
  'VALIDATION',
  'PLANNING',
  'SIMULATION',
  'SUBMISSION',
  'OBSERVATION',
  'VERIFICATION',
  'RETRY',
]);
export type ExecutionStage = z.infer<typeof ExecutionStageSchema>;

// ─── Event Type ─────────────────────────────────────────────────────────────

export const EventTypeSchema = z.enum([
  'STARTED',
  'COMPLETED',
  'FAILED',
  'WARNING',
  'STATE_CHANGE',
  'RETRY',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

// ─── Execution Event ────────────────────────────────────────────────────────

export const ExecutionEventSchema = z.object({
  stage: z.string(),
  type: z.string(),
  message: z.string(),
  timestamp: TimestampSchema,
  details: z.record(z.unknown()).optional(),
});
export type ExecutionEvent = z.infer<typeof ExecutionEventSchema>;

// ─── Execution Outcome ──────────────────────────────────────────────────────

export const ExecutionOutcomeSchema = z.object({
  success: z.boolean(),
  actualOutput: AssetAmountSchema.optional(),
  actualFees: AmountSchema,
  actualSlippageBps: BpsSchema,
  positionId: z.string().optional(),
  transactionId: z.string().optional(),
});
export type ExecutionOutcome = z.infer<typeof ExecutionOutcomeSchema>;

// ─── Intent Status Event (streaming) ────────────────────────────────────────

export const IntentStatusEventSchema = z.object({
  intentId: UUIDSchema,
  state: ExecutionStateSchema,
  event: ExecutionEventSchema,
  timestamp: TimestampSchema,
});
export type IntentStatusEvent = z.infer<typeof IntentStatusEventSchema>;

// ─── Cost Model ─────────────────────────────────────────────────────────────

export const CostModelSchema = z.object({
  networkFee: AmountSchema,
  protocolFee: AmountSchema,
  priorityFee: AmountSchema,
  priceImpactBps: BpsSchema,
});
export type CostModel = z.infer<typeof CostModelSchema>;

// ─── Risk Model ─────────────────────────────────────────────────────────────

export const RiskFactorSchema = z.object({
  type: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  message: z.string(),
});
export type RiskFactor = z.infer<typeof RiskFactorSchema>;

export const RiskModelSchema = z.object({
  riskScore: z.number().min(0).max(100),
  factors: z.array(RiskFactorSchema),
});
export type RiskModel = z.infer<typeof RiskModelSchema>;

// ─── Route Hop ──────────────────────────────────────────────────────────────

export const RouteHopSchema = z.object({
  venue: z.string(),
  pool: z.string(),
  inputAsset: z.string(),
  outputAsset: z.string(),
  portion: z.number().min(0).max(1),
});
export type RouteHop = z.infer<typeof RouteHopSchema>;

// ─── Quote ──────────────────────────────────────────────────────────────────

export const QuoteSchema = z.object({
  outputAmount: AmountSchema,
  minOutput: AmountSchema,
  price: z.string(),
  validUntil: TimestampSchema,
  route: z.array(RouteHopSchema).optional(),
  cost: CostModelSchema,
});
export type Quote = z.infer<typeof QuoteSchema>;

// ─── Execution Plan ─────────────────────────────────────────────────────────

export const ExecutionStepSchema = z.object({
  kind: z.string(),
  venue: z.string(),
  parameters: z.record(z.unknown()),
  expectedOutput: AssetAmountSchema.optional(),
});
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>;

export const ExecutionPlanSchema = z.object({
  intentId: UUIDSchema,
  steps: z.array(ExecutionStepSchema),
  cost: CostModelSchema,
  expiresAt: TimestampSchema,
});
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

// ─── Intent Status ──────────────────────────────────────────────────────────

export const IntentStatusSchema = z.object({
  intentId: UUIDSchema,
  state: ExecutionStateSchema,
  outcome: ExecutionOutcomeSchema.optional(),
  events: z.array(ExecutionEventSchema),
  createdAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
});
export type IntentStatus = z.infer<typeof IntentStatusSchema>;

// ─── Intent Summary (for list) ──────────────────────────────────────────────

export const IntentSummarySchema = z.object({
  id: UUIDSchema,
  action: z.string(),
  state: ExecutionStateSchema,
  createdAt: TimestampSchema,
  label: z.string().optional(),
  input: AssetAmountSchema.optional(),
  output: AssetAmountSchema.optional(),
});
export type IntentSummary = z.infer<typeof IntentSummarySchema>;

// ─── Kill Result ────────────────────────────────────────────────────────────

export const KillResultSchema = z.object({
  executionsKilled: z.number().int(),
  agentsStopped: z.number().int(),
  killedAt: TimestampSchema,
});
export type KillResult = z.infer<typeof KillResultSchema>;

// ─── Queue Status ───────────────────────────────────────────────────────────

export const QueueStatusSchema = z.object({
  pendingIntents: z.number().int(),
  executingIntents: z.number().int(),
  runningAgents: z.number().int(),
  paused: z.boolean(),
  pausedAt: TimestampSchema.optional(),
});
export type QueueStatus = z.infer<typeof QueueStatusSchema>;
