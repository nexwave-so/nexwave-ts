import { Hono } from 'hono';
import type { MockState } from '../state';

const startTime = Date.now();

export function createSystemHandlers(app: Hono, state: MockState) {
  // Health check
  app.get('/api/v1/health', async (c) => {
    return c.json({
      status: 'healthy',
      message: 'Mock server is running',
      components: {
        kernel: { name: 'kernel', status: 'healthy', latencyMs: 1 },
        adapters: { name: 'adapters', status: 'healthy', latencyMs: 5 },
      },
      checkedAt: Date.now(),
    });
  });

  // Runtime info
  app.get('/api/v1/info', async (c) => {
    return c.json({
      version: '0.1.0-mock',
      commit: 'mock-server',
      buildTime: '2026-01-15T00:00:00Z',
      startedAt: startTime,
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      environment: 'DEVELOPMENT',
    });
  });

  // Get config
  app.get('/api/v1/config', async (c) => {
    return c.json({
      adapters: ['mock-venue'],
      defaultTimeout: 30000,
      maxRetries: 3,
    });
  });

  // Update config
  app.patch('/api/v1/config', async (c) => {
    const body = await c.req.json();
    // Mock - just echo back with defaults
    return c.json({
      adapters: body.adapters ?? ['mock-venue'],
      defaultTimeout: body.defaultTimeout ?? 30000,
      maxRetries: body.maxRetries ?? 3,
    });
  });

  // List adapters
  app.get('/api/v1/adapters', async (c) => {
    return c.json({
      adapters: [
        {
          id: 'mock-adapter',
          name: 'Mock Adapter',
          chain: 'solana',
          status: 'connected',
          latencyMs: 10,
        },
      ],
    });
  });
}
