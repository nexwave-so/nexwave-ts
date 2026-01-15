import type { Intent, ExecutionState, UUID, Timestamp } from '@nexwave/types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StoredIntent {
  id: UUID;
  intent: Intent;
  state: ExecutionState;
  events: Array<{
    stage: string;
    type: string;
    message: string;
    timestamp: Timestamp;
  }>;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  outcome?: {
    success: boolean;
    actualOutput?: { asset: { symbol: string; decimals: number }; amount: string };
    actualFees: string;
    actualSlippageBps: number;
    transactionId?: string;
  };
}

export interface StoredAgent {
  id: string;
  name: string;
  status: 'CREATED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'FAILED';
  config: Record<string, unknown>;
  state: {
    executionCount: number;
    dailyNotional: string;
    consecutiveFailures: number;
    lastExecutionAt?: Timestamp;
    nextExecutionAt?: Timestamp;
  };
  createdAt: Timestamp;
  startedAt?: Timestamp;
  stoppedAt?: Timestamp;
}

export interface MockFailure {
  code: string;
  message: string;
  status: number;
}

// ─── Mock State Manager ─────────────────────────────────────────────────────

export class MockState {
  private intents: Map<UUID, StoredIntent> = new Map();
  private agents: Map<string, StoredAgent> = new Map();
  private intentWatchers: Map<UUID, Set<(event: unknown) => void>> = new Map();

  // Mock controls
  private nextFailure: MockFailure | null = null;
  private latencyMs: number = 0;
  private paused: boolean = false;

  // ─── Intents ──────────────────────────────────────────────────────────────

  createIntent(intent: Intent): StoredIntent {
    const id = intent.id ?? crypto.randomUUID();
    const now = Date.now();

    const stored: StoredIntent = {
      id,
      intent: { ...intent, id },
      state: 'PENDING',
      events: [
        {
          stage: 'SUBMISSION',
          type: 'STARTED',
          message: 'Intent received',
          timestamp: now,
        },
      ],
      createdAt: now,
    };

    this.intents.set(id, stored);

    // Start async execution simulation
    this.simulateExecution(id);

    return stored;
  }

  getIntent(id: UUID): StoredIntent | undefined {
    return this.intents.get(id);
  }

  listIntents(filters?: {
    states?: ExecutionState[];
    limit?: number;
    cursor?: string;
  }): { intents: StoredIntent[]; nextCursor?: string } {
    let results = Array.from(this.intents.values());

    if (filters?.states?.length) {
      results = results.filter((i) => filters.states!.includes(i.state));
    }

    // Sort by createdAt desc
    results.sort((a, b) => b.createdAt - a.createdAt);

    const limit = filters?.limit ?? 20;
    const startIndex = filters?.cursor ? parseInt(filters.cursor) : 0;
    const slice = results.slice(startIndex, startIndex + limit);

    return {
      intents: slice,
      nextCursor:
        startIndex + limit < results.length ? String(startIndex + limit) : undefined,
    };
  }

  cancelIntent(id: UUID): StoredIntent | undefined {
    const intent = this.intents.get(id);
    if (!intent) return undefined;

    if (intent.state === 'COMPLETED' || intent.state === 'FAILED') {
      return intent; // Can't cancel completed intents
    }

    intent.state = 'CANCELLED';
    intent.completedAt = Date.now();
    intent.events.push({
      stage: 'SUBMISSION',
      type: 'CANCELLED',
      message: 'Intent cancelled by user',
      timestamp: Date.now(),
    });

    this.notifyWatchers(id, {
      intentId: id,
      state: 'CANCELLED',
      event: intent.events[intent.events.length - 1],
      timestamp: Date.now(),
    });

    return intent;
  }

  watchIntent(id: UUID, callback: (event: unknown) => void): () => void {
    if (!this.intentWatchers.has(id)) {
      this.intentWatchers.set(id, new Set());
    }
    this.intentWatchers.get(id)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.intentWatchers.get(id)?.delete(callback);
    };
  }

  private notifyWatchers(id: UUID, event: unknown) {
    this.intentWatchers.get(id)?.forEach((cb) => cb(event));
  }

  private async simulateExecution(id: UUID) {
    const intent = this.intents.get(id);
    if (!intent) return;

    const stages: Array<{
      state: ExecutionState;
      message: string;
      delay: number;
    }> = [
      { state: 'VALIDATING', message: 'Validating intent', delay: 200 },
      { state: 'PLANNING', message: 'Building execution plan', delay: 300 },
      { state: 'SIMULATING', message: 'Simulating transaction', delay: 500 },
      { state: 'SUBMITTING', message: 'Submitting to chain', delay: 400 },
      { state: 'CONFIRMING', message: 'Waiting for confirmation', delay: 1000 },
      { state: 'VERIFYING', message: 'Verifying outcome', delay: 300 },
    ];

    for (const stage of stages) {
      await new Promise((r) => setTimeout(r, stage.delay));

      // Check if cancelled
      const current = this.intents.get(id);
      if (!current || current.state === 'CANCELLED') return;

      // Random failure chance (5%)
      if (Math.random() < 0.05 && stage.state !== 'VALIDATING') {
        current.state = 'FAILED';
        current.completedAt = Date.now();
        current.events.push({
          stage: stage.state,
          type: 'FAILED',
          message: `Simulated failure at ${stage.state}`,
          timestamp: Date.now(),
        });
        this.notifyWatchers(id, {
          intentId: id,
          state: 'FAILED',
          event: current.events[current.events.length - 1],
          timestamp: Date.now(),
        });
        return;
      }

      current.state = stage.state;
      current.events.push({
        stage: stage.state,
        type: 'STATE_CHANGE',
        message: stage.message,
        timestamp: Date.now(),
      });

      this.notifyWatchers(id, {
        intentId: id,
        state: stage.state,
        event: current.events[current.events.length - 1],
        timestamp: Date.now(),
      });
    }

    // Complete successfully
    const final = this.intents.get(id);
    if (!final || final.state === 'CANCELLED') return;

    final.state = 'COMPLETED';
    final.completedAt = Date.now();
    final.outcome = {
      success: true,
      actualOutput: {
        asset: final.intent.output,
        amount: '526180000000', // Mock output
      },
      actualFees: '5000',
      actualSlippageBps: 25,
      transactionId: `mock-tx-${id.slice(0, 8)}`,
    };
    final.events.push({
      stage: 'VERIFICATION',
      type: 'COMPLETED',
      message: 'Execution completed successfully',
      timestamp: Date.now(),
    });

    this.notifyWatchers(id, {
      intentId: id,
      state: 'COMPLETED',
      event: final.events[final.events.length - 1],
      timestamp: Date.now(),
    });
  }

  // ─── Agents ───────────────────────────────────────────────────────────────

  createAgent(name: string, config: Record<string, unknown>): StoredAgent {
    const id = `agt_${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();

    const agent: StoredAgent = {
      id,
      name,
      status: 'CREATED',
      config,
      state: {
        executionCount: 0,
        dailyNotional: '0',
        consecutiveFailures: 0,
      },
      createdAt: now,
    };

    this.agents.set(id, agent);
    return agent;
  }

  getAgent(id: string): StoredAgent | undefined {
    return this.agents.get(id);
  }

  listAgents(): StoredAgent[] {
    return Array.from(this.agents.values());
  }

  startAgent(id: string): StoredAgent | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    agent.status = 'RUNNING';
    agent.startedAt = Date.now();
    return agent;
  }

  stopAgent(id: string): StoredAgent | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;

    agent.status = 'STOPPED';
    agent.stoppedAt = Date.now();
    return agent;
  }

  deleteAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  // ─── Execution Control ────────────────────────────────────────────────────

  isPaused(): boolean {
    return this.paused;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  kill(): { executionsKilled: number; agentsStopped: number } {
    let executionsKilled = 0;
    let agentsStopped = 0;

    // Cancel all pending intents
    for (const intent of this.intents.values()) {
      if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(intent.state)) {
        intent.state = 'CANCELLED';
        intent.completedAt = Date.now();
        executionsKilled++;
      }
    }

    // Stop all running agents
    for (const agent of this.agents.values()) {
      if (agent.status === 'RUNNING') {
        agent.status = 'STOPPED';
        agent.stoppedAt = Date.now();
        agentsStopped++;
      }
    }

    return { executionsKilled, agentsStopped };
  }

  getQueueStatus() {
    let pending = 0;
    let executing = 0;

    for (const intent of this.intents.values()) {
      if (intent.state === 'PENDING') pending++;
      if (
        [
          'VALIDATING',
          'PLANNING',
          'SIMULATING',
          'SUBMITTING',
          'CONFIRMING',
          'VERIFYING',
        ].includes(intent.state)
      ) {
        executing++;
      }
    }

    const runningAgents = Array.from(this.agents.values()).filter(
      (a) => a.status === 'RUNNING'
    ).length;

    return {
      pendingIntents: pending,
      executingIntents: executing,
      runningAgents,
      paused: this.paused,
    };
  }

  // ─── Mock Controls ────────────────────────────────────────────────────────

  setNextFailure(failure: MockFailure) {
    this.nextFailure = failure;
  }

  shouldFailNext(): boolean {
    return this.nextFailure !== null;
  }

  consumeFailure(): MockFailure {
    const failure = this.nextFailure!;
    this.nextFailure = null;
    return failure;
  }

  setLatency(ms: number) {
    this.latencyMs = ms;
  }

  getLatency(): number {
    return this.latencyMs;
  }

  reset() {
    this.intents.clear();
    this.agents.clear();
    this.intentWatchers.clear();
    this.nextFailure = null;
    this.latencyMs = 0;
    this.paused = false;
  }
}
