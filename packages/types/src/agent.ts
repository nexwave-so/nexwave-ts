import { z } from 'zod';
import { AmountSchema, PriceSchema, TimestampSchema } from './common';
import { AssetSchema, IntentSchema } from './intent';
import { ExecutionOutcomeSchema } from './execution';

// ─── Agent Status ───────────────────────────────────────────────────────────

export const AgentStatusSchema = z.enum([
  'CREATED',
  'STARTING',
  'RUNNING',
  'STOPPING',
  'STOPPED',
  'FAILED',
  'PAUSED',
]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

// ─── Agent Schedule ─────────────────────────────────────────────────────────

export const AgentScheduleSchema = z.object({
  once: z.boolean().optional(),
  intervalMs: z.number().int().positive().optional(),
  cron: z.string().optional(),
  triggerOnly: z.boolean().optional(),
});
export type AgentSchedule = z.infer<typeof AgentScheduleSchema>;

// ─── Agent Limits ───────────────────────────────────────────────────────────

export const AgentLimitsSchema = z.object({
  maxExecutionsPerDay: z.number().int().positive().optional(),
  maxDailyNotional: AmountSchema.optional(),
  maxSingleNotional: AmountSchema.optional(),
  maxConcurrent: z.number().int().positive().optional(),
  circuitBreakerThreshold: z.number().int().positive().optional(),
});
export type AgentLimits = z.infer<typeof AgentLimitsSchema>;

// ─── Price Trigger ──────────────────────────────────────────────────────────

export const PriceConditionSchema = z.enum([
  'ABOVE',
  'BELOW',
  'CROSSES_ABOVE',
  'CROSSES_BELOW',
]);
export type PriceCondition = z.infer<typeof PriceConditionSchema>;

export const PriceTriggerSchema = z.object({
  type: z.literal('price'),
  asset: AssetSchema,
  threshold: PriceSchema,
  condition: PriceConditionSchema,
});
export type PriceTrigger = z.infer<typeof PriceTriggerSchema>;

// ─── Time Trigger ───────────────────────────────────────────────────────────

export const TimeTriggerSchema = z.object({
  type: z.literal('time'),
  at: TimestampSchema,
});
export type TimeTrigger = z.infer<typeof TimeTriggerSchema>;

// ─── Event Trigger ──────────────────────────────────────────────────────────

export const EventTriggerSchema = z.object({
  type: z.literal('event'),
  eventType: z.string(),
  filters: z.record(z.string()).optional(),
});
export type EventTrigger = z.infer<typeof EventTriggerSchema>;

// ─── Agent Trigger ──────────────────────────────────────────────────────────

export const AgentTriggerSchema = z.discriminatedUnion('type', [
  PriceTriggerSchema,
  TimeTriggerSchema,
  EventTriggerSchema,
]);
export type AgentTrigger = z.infer<typeof AgentTriggerSchema>;

// ─── Agent Config ───────────────────────────────────────────────────────────

export const AgentConfigSchema = z.object({
  intentTemplate: IntentSchema,
  schedule: AgentScheduleSchema.optional(),
  limits: AgentLimitsSchema.optional(),
  triggers: z.array(AgentTriggerSchema).optional(),
  adapters: z.array(z.string()).optional(),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ─── Agent State ────────────────────────────────────────────────────────────

export const AgentStateSchema = z.object({
  executionCount: z.number().int(),
  dailyNotional: AmountSchema,
  consecutiveFailures: z.number().int(),
  lastOutcome: ExecutionOutcomeSchema.optional(),
  lastExecutionAt: TimestampSchema.optional(),
  nextExecutionAt: TimestampSchema.optional(),
});
export type AgentState = z.infer<typeof AgentStateSchema>;

// ─── Agent ──────────────────────────────────────────────────────────────────

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: AgentStatusSchema,
  config: AgentConfigSchema,
  state: AgentStateSchema,
  createdAt: TimestampSchema,
  startedAt: TimestampSchema.optional(),
  stoppedAt: TimestampSchema.optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

// ─── Agent Event Types ──────────────────────────────────────────────────────

export const AgentEventTypeSchema = z.enum([
  'STARTED',
  'STOPPED',
  'EXECUTION_STARTED',
  'EXECUTION_COMPLETED',
  'EXECUTION_FAILED',
  'TRIGGER_FIRED',
  'LIMIT_REACHED',
  'CIRCUIT_BREAKER',
]);
export type AgentEventType = z.infer<typeof AgentEventTypeSchema>;

// ─── Agent Event ────────────────────────────────────────────────────────────

export const AgentEventSchema = z.object({
  agentId: z.string(),
  type: AgentEventTypeSchema,
  message: z.string().optional(),
  detailsJson: z.string().optional(),
  timestamp: TimestampSchema,
});
export type AgentEvent = z.infer<typeof AgentEventSchema>;

// ─── Agent Metrics ──────────────────────────────────────────────────────────

export const AgentMetricsSchema = z.object({
  totalExecutions: z.number().int(),
  successfulExecutions: z.number().int(),
  failedExecutions: z.number().int(),
  successRate: z.number().min(0).max(1),
  avgExecutionTimeMs: z.number().int(),
  p50ExecutionTimeMs: z.number().int(),
  p95ExecutionTimeMs: z.number().int(),
  p99ExecutionTimeMs: z.number().int(),
  totalFeesPaid: AmountSchema,
  avgFeePerExecution: AmountSchema,
  avgSlippageBps: z.number(),
  maxSlippageBps: z.number().int(),
  totalNotional: AmountSchema,
  avgNotionalPerExecution: AmountSchema,
});
export type AgentMetrics = z.infer<typeof AgentMetricsSchema>;

// ─── Log Entry ──────────────────────────────────────────────────────────────

export const LogEntrySchema = z.object({
  timestamp: TimestampSchema,
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
  message: z.string(),
  executionId: z.string().optional(),
  fields: z.record(z.string()).optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;
