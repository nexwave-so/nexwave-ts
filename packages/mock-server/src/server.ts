import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';

import { MockState } from './state';
import { createIntentHandlers } from './handlers/intents';
import { createAgentHandlers } from './handlers/agents';
import { createExecutionHandlers } from './handlers/execution';
import { createMarketHandlers } from './handlers/market';
import { createSystemHandlers } from './handlers/system';
import { createMockControlHandlers } from './handlers/mock-controls';

export function createServer() {
  const app = new Hono();
  const state = new MockState();

  // Middleware
  app.use('*', cors());
  app.use('*', logger());
  app.use('*', timing());

  // Auth middleware (mock - just check header exists)
  app.use('/api/v1/*', async (c, next) => {
    // Skip auth for health check
    if (c.req.path === '/api/v1/health') {
      return next();
    }

    const auth = c.req.header('Authorization');
    if (!auth?.startsWith('Bearer nxw_')) {
      return c.json(
        { code: 'UNAUTHENTICATED', message: 'Missing or invalid API key' },
        401
      );
    }

    // Check mock controls for forced failures
    if (state.shouldFailNext()) {
      const failure = state.consumeFailure();
      return c.json({ code: failure.code, message: failure.message }, failure.status as 400 | 401 | 403 | 404 | 429 | 500);
    }

    // Add artificial latency if configured
    const latency = state.getLatency();
    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }

    return next();
  });

  // Mount handlers
  createIntentHandlers(app, state);
  createAgentHandlers(app, state);
  createExecutionHandlers(app, state);
  createMarketHandlers(app, state);
  createSystemHandlers(app, state);
  createMockControlHandlers(app, state);

  return app;
}
