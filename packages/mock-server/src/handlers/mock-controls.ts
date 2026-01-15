import { Hono } from 'hono';
import type { MockState } from '../state';

export function createMockControlHandlers(app: Hono, state: MockState) {
  // Reset all state
  app.post('/_mock/reset', async (c) => {
    state.reset();
    return c.json({ reset: true, timestamp: Date.now() });
  });

  // Make next request fail
  app.post('/_mock/fail-next', async (c) => {
    const body = await c.req.json();
    const { code = 'INTERNAL', message = 'Simulated failure', status = 500 } = body;

    state.setNextFailure({ code, message, status });

    return c.json({
      configured: true,
      failure: { code, message, status },
    });
  });

  // Set artificial latency
  app.post('/_mock/set-latency', async (c) => {
    const body = await c.req.json();
    const { ms = 0 } = body;

    state.setLatency(ms);

    return c.json({ latencyMs: ms });
  });

  // Get mock state (for debugging)
  app.get('/_mock/state', async (c) => {
    return c.json({
      queueStatus: state.getQueueStatus(),
      latencyMs: state.getLatency(),
      failNextConfigured: state.shouldFailNext(),
    });
  });
}
