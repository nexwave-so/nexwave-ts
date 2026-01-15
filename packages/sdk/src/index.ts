// Client
export { NexwaveClient } from './client';
export type { ClientConfig, TransportType } from './config';

// Services
export {
  IntentService,
  AgentService,
  ExecutionService,
  MarketService,
  SystemService,
} from './services';
export type {
  SubmitOptions,
  SubmitResult,
  SimulationResult,
  Quote,
  RouteHop,
  CostModel,
  RiskModel,
  RiskFactor,
  ExecutionPlan,
  ExecutionStep,
  IntentStatus,
  ExecutionOutcome,
  ExecutionEvent,
  IntentStatusEvent,
  ListFilters,
  IntentList,
  IntentSummary,
  CancelResult,
  ValidationResult,
  CreateAgentConfig,
  StopOptions,
  AgentFilters,
  AgentList,
  LogOptions,
  LogEntries,
  TimeRange,
  KillResult,
  QueueStatus,
  GlobalMetrics,
  AssetPair,
  MarketStateResponse,
  QuoteResponse,
  RuntimeConfig,
} from './services';

// Builders
export { IntentBuilder, AgentConfigBuilder } from './builders';

// Errors
export {
  NexwaveError,
  ValidationError,
  ExecutionError,
  TransportError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from './errors';

// Re-export types from @nexwave/types
export * from '@nexwave/types';
