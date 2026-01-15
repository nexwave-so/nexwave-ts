import type {
  Agent,
  AgentConfig,
  AgentEvent,
  AgentMetrics,
  LogEntry,
  Timestamp,
} from '@nexwave/types';
import type { RestTransport } from '../transport/rest';

// ─── Request/Response Types ─────────────────────────────────────────────────

export interface CreateAgentConfig {
  name: string;
  config: AgentConfig;
  startImmediately?: boolean;
}

export interface StopOptions {
  graceful?: boolean;
  timeoutMs?: number;
}

export interface AgentFilters {
  status?: string[];
  limit?: number;
  cursor?: string;
}

export interface AgentList {
  agents: Agent[];
  nextCursor?: string;
  totalCount: number;
}

export interface LogOptions {
  limit?: number;
  cursor?: string;
  after?: Timestamp;
  before?: Timestamp;
  levels?: string[];
}

export interface LogEntries {
  entries: LogEntry[];
  nextCursor?: string;
}

export interface TimeRange {
  from: Timestamp;
  to: Timestamp;
}

// ─── Agent Service ──────────────────────────────────────────────────────────

export class AgentService {
  constructor(private transport: RestTransport) {}

  /**
   * Create a new agent.
   */
  async create(config: CreateAgentConfig): Promise<Agent> {
    const response = await this.transport.request<{ agent: Agent }>({
      method: 'POST',
      path: '/agents',
      body: config,
    });
    return response.agent;
  }

  /**
   * Get agent details.
   */
  async get(agentId: string): Promise<Agent> {
    return this.transport.request<Agent>({
      method: 'GET',
      path: `/agents/${agentId}`,
    });
  }

  /**
   * Update agent configuration.
   */
  async update(agentId: string, config: Partial<AgentConfig>): Promise<Agent> {
    return this.transport.request<Agent>({
      method: 'PATCH',
      path: `/agents/${agentId}`,
      body: { config },
    });
  }

  /**
   * Start an agent.
   */
  async start(agentId: string): Promise<Agent> {
    const response = await this.transport.request<{ agent: Agent }>({
      method: 'POST',
      path: `/agents/${agentId}/start`,
    });
    return response.agent;
  }

  /**
   * Stop an agent.
   */
  async stop(agentId: string, options: StopOptions = {}): Promise<Agent> {
    const response = await this.transport.request<{ agent: Agent; wasExecuting: boolean }>({
      method: 'POST',
      path: `/agents/${agentId}/stop`,
      body: options,
    });
    return response.agent;
  }

  /**
   * Delete an agent.
   */
  async delete(agentId: string): Promise<void> {
    await this.transport.request<{ deleted: boolean }>({
      method: 'DELETE',
      path: `/agents/${agentId}`,
    });
  }

  /**
   * List agents with optional filters.
   */
  async list(filters: AgentFilters = {}): Promise<AgentList> {
    const params = new URLSearchParams();
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.cursor) params.set('cursor', filters.cursor);
    if (filters.status?.length) params.set('status', filters.status.join(','));

    const query = params.toString();
    return this.transport.request<AgentList>({
      method: 'GET',
      path: `/agents${query ? `?${query}` : ''}`,
    });
  }

  /**
   * Get agent logs.
   */
  async getLogs(agentId: string, options: LogOptions = {}): Promise<LogEntries> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.after) params.set('after', options.after.toString());
    if (options.before) params.set('before', options.before.toString());
    if (options.levels?.length) params.set('levels', options.levels.join(','));

    const query = params.toString();
    return this.transport.request<LogEntries>({
      method: 'GET',
      path: `/agents/${agentId}/logs${query ? `?${query}` : ''}`,
    });
  }

  /**
   * Get agent metrics.
   */
  async getMetrics(agentId: string, timeRange: TimeRange): Promise<AgentMetrics> {
    const params = new URLSearchParams();
    params.set('from', timeRange.from.toString());
    params.set('to', timeRange.to.toString());

    const response = await this.transport.request<{ metrics: AgentMetrics }>({
      method: 'GET',
      path: `/agents/${agentId}/metrics?${params.toString()}`,
    });
    return response.metrics;
  }

  /**
   * Watch agent events (streaming).
   */
  async *watchEvents(agentId: string): AsyncIterable<AgentEvent> {
    yield* this.transport.stream<AgentEvent>(`/agents/${agentId}/watch`);
  }
}
