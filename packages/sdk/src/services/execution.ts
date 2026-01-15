import type { Timestamp } from '@nexwave/types';
import type { RestTransport } from '../transport/rest';

// ─── Response Types ─────────────────────────────────────────────────────────

export interface KillResult {
  executionsKilled: number;
  agentsStopped: number;
  killedAt: Timestamp;
  reason?: string;
}

export interface QueueStatus {
  pendingIntents: number;
  executingIntents: number;
  runningAgents: number;
  paused: boolean;
  pausedAt?: Timestamp;
}

export interface GlobalMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgExecutionTimeMs: number;
  totalNotional: string;
  totalFeesPaid: string;
}

// ─── Execution Service ──────────────────────────────────────────────────────

export class ExecutionService {
  constructor(private transport: RestTransport) {}

  /**
   * Emergency kill switch - stop all executions.
   */
  async kill(reason: string, agentId?: string): Promise<KillResult> {
    return this.transport.request<KillResult>({
      method: 'POST',
      path: '/exec/kill',
      body: { reason, agentId },
    });
  }

  /**
   * Pause all executions.
   */
  async pause(): Promise<{ paused: boolean; pausedAt: Timestamp }> {
    return this.transport.request({
      method: 'POST',
      path: '/exec/pause',
    });
  }

  /**
   * Resume executions.
   */
  async resume(): Promise<{ paused: boolean; resumedAt: Timestamp }> {
    return this.transport.request({
      method: 'POST',
      path: '/exec/resume',
    });
  }

  /**
   * Get execution queue status.
   */
  async getQueueStatus(): Promise<QueueStatus> {
    return this.transport.request<QueueStatus>({
      method: 'GET',
      path: '/exec/status',
    });
  }

  /**
   * Get global execution metrics.
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    return this.transport.request<GlobalMetrics>({
      method: 'GET',
      path: '/exec/metrics',
    });
  }
}
