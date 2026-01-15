import type {
  Intent,
  ExecutionState,
  UUID,
  Timestamp,
  AssetAmount,
  Amount,
  Bps,
} from '@nexwave/types';
import { IntentSchema } from '@nexwave/types';
import type { RestTransport } from '../transport/rest';
import { ValidationError } from '../errors';

// ─── Request/Response Types ─────────────────────────────────────────────────

export interface SubmitOptions {
  /** Run simulation first (default: true) */
  simulateFirst?: boolean;
  /** Specific adapter to use */
  adapter?: string;
  /** Idempotency key */
  idempotencyKey?: string;
}

export interface SubmitResult {
  intentId: UUID;
  state: ExecutionState;
  plan?: ExecutionPlan;
  quote?: Quote;
  submittedAt: Timestamp;
}

export interface SimulationResult {
  success: boolean;
  quote?: Quote;
  plan?: ExecutionPlan;
  warnings: string[];
  failureReason?: string;
  estimatedCost: CostModel;
  riskAssessment: RiskModel;
}

export interface Quote {
  outputAmount: Amount;
  minOutput: Amount;
  price: string;
  validUntil: Timestamp;
  route?: RouteHop[];
  cost: CostModel;
}

export interface RouteHop {
  venue: string;
  pool: string;
  inputAsset: string;
  outputAsset: string;
  portion: number;
}

export interface CostModel {
  networkFee: Amount;
  protocolFee: Amount;
  priorityFee: Amount;
  priceImpactBps: Bps;
}

export interface RiskModel {
  riskScore: number;
  factors: RiskFactor[];
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export interface ExecutionPlan {
  intentId: UUID;
  steps: ExecutionStep[];
  cost: CostModel;
  expiresAt: Timestamp;
}

export interface ExecutionStep {
  kind: string;
  venue: string;
  parameters: Record<string, unknown>;
  expectedOutput?: AssetAmount;
}

export interface IntentStatus {
  intentId: UUID;
  state: ExecutionState;
  outcome?: ExecutionOutcome;
  events: ExecutionEvent[];
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

export interface ExecutionOutcome {
  success: boolean;
  actualOutput?: AssetAmount;
  actualFees: Amount;
  actualSlippageBps: Bps;
  positionId?: string;
  transactionId?: string;
}

export interface ExecutionEvent {
  stage: string;
  type: string;
  message: string;
  timestamp: Timestamp;
  details?: Record<string, unknown>;
}

export interface IntentStatusEvent {
  intentId: UUID;
  state: ExecutionState;
  event: ExecutionEvent;
  timestamp: Timestamp;
}

export interface ListFilters {
  limit?: number;
  cursor?: string;
  states?: ExecutionState[];
  after?: Timestamp;
  before?: Timestamp;
  agentId?: string;
  label?: string;
}

export interface IntentList {
  intents: IntentSummary[];
  nextCursor?: string;
  totalCount: number;
}

export interface IntentSummary {
  id: UUID;
  action: string;
  state: ExecutionState;
  createdAt: Timestamp;
  label?: string;
  input?: AssetAmount;
  output?: AssetAmount;
}

export interface CancelResult {
  cancelled: boolean;
  finalState: ExecutionState;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
}

// ─── Intent Service ─────────────────────────────────────────────────────────

export class IntentService {
  constructor(private transport: RestTransport) {}

  /**
   * Submit an intent for execution.
   */
  async submit(intent: Intent, options: SubmitOptions = {}): Promise<SubmitResult> {
    // Validate intent
    const validation = IntentSchema.safeParse(intent);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid intent',
        validation.error.errors.map((e: { path: (string | number)[]; message: string }) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    return this.transport.request<SubmitResult>({
      method: 'POST',
      path: '/intents',
      body: {
        intent: validation.data,
        simulateFirst: options.simulateFirst ?? true,
        adapter: options.adapter,
        idempotencyKey: options.idempotencyKey,
      },
    });
  }

  /**
   * Simulate an intent without executing.
   */
  async simulate(intent: Intent): Promise<SimulationResult> {
    const validation = IntentSchema.safeParse(intent);
    if (!validation.success) {
      throw new ValidationError(
        'Invalid intent',
        validation.error.errors.map((e: { path: (string | number)[]; message: string }) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    return this.transport.request<SimulationResult>({
      method: 'POST',
      path: '/intents/simulate',
      body: { intent: validation.data },
    });
  }

  /**
   * Validate an intent without simulating.
   */
  async validate(intent: Intent): Promise<ValidationResult> {
    return this.transport.request<ValidationResult>({
      method: 'POST',
      path: '/intents/validate',
      body: { intent },
    });
  }

  /**
   * Get the status of an intent.
   */
  async getStatus(intentId: UUID): Promise<IntentStatus> {
    return this.transport.request<IntentStatus>({
      method: 'GET',
      path: `/intents/${intentId}`,
    });
  }

  /**
   * Cancel a pending intent.
   */
  async cancel(intentId: UUID, reason?: string): Promise<CancelResult> {
    return this.transport.request<CancelResult>({
      method: 'POST',
      path: `/intents/${intentId}/cancel`,
      body: { reason },
    });
  }

  /**
   * List intents with optional filters.
   */
  async list(filters: ListFilters = {}): Promise<IntentList> {
    const params = new URLSearchParams();
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.cursor) params.set('cursor', filters.cursor);
    if (filters.states?.length) params.set('states', filters.states.join(','));
    if (filters.after) params.set('after', filters.after.toString());
    if (filters.before) params.set('before', filters.before.toString());
    if (filters.agentId) params.set('agent_id', filters.agentId);
    if (filters.label) params.set('label', filters.label);

    const query = params.toString();
    return this.transport.request<IntentList>({
      method: 'GET',
      path: `/intents${query ? `?${query}` : ''}`,
    });
  }

  /**
   * Watch intent status updates (streaming).
   */
  async *watchStatus(intentId: UUID): AsyncIterable<IntentStatusEvent> {
    yield* this.transport.stream<IntentStatusEvent>(`/intents/${intentId}/watch`);
  }
}
