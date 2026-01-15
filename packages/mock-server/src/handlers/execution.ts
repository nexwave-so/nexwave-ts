import { Hono } from 'hono';
import type { MockState } from '../state';

export function createExecutionHandlers(app: Hono, state: MockState) {
  // Kill switch
  app.post('/api/v1/exec/kill', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { reason = 'Manual kill' } = body;

    const result = state.kill();

    return c.json({
      executionsKilled: result.executionsKilled,
      agentsStopped: result.agentsStopped,
      killedAt: Date.now(),
      reason,
    });
  });

  // Pause
  app.post('/api/v1/exec/pause', async (c) => {
    state.pause();
    return c.json({ paused: true, pausedAt: Date.now() });
  });

  // Resume
  app.post('/api/v1/exec/resume', async (c) => {
    state.resume();
    return c.json({ paused: false, resumedAt: Date.now() });
  });

  // Queue status
  app.get('/api/v1/exec/status', async (c) => {
    const status = state.getQueueStatus();
    return c.json(status);
  });

  // Global metrics (mock)
  app.get('/api/v1/exec/metrics', async (c) => {
    return c.json({
      totalExecutions: 100,
      successfulExecutions: 95,
      failedExecutions: 5,
      avgExecutionTimeMs: 2500,
      totalNotional: '100000000000',
      totalFeesPaid: '500000',
    });
  });
}
