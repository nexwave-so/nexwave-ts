import { Hono } from 'hono';
import type { MockState } from '../state';

export function createAgentHandlers(app: Hono, state: MockState) {
  // Create agent
  app.post('/api/v1/agents', async (c) => {
    const body = await c.req.json();
    const { name, config, startImmediately } = body;

    if (!name || !config) {
      return c.json(
        { code: 'INVALID_ARGUMENT', message: 'Name and config are required' },
        400
      );
    }

    const agent = state.createAgent(name, config);

    if (startImmediately) {
      state.startAgent(agent.id);
    }

    return c.json({ agent });
  });

  // Get agent
  app.get('/api/v1/agents/:id', async (c) => {
    const id = c.req.param('id');
    const agent = state.getAgent(id);

    if (!agent) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    return c.json(agent);
  });

  // Update agent
  app.patch('/api/v1/agents/:id', async (c) => {
    const id = c.req.param('id');
    const agent = state.getAgent(id);

    if (!agent) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    const body = await c.req.json();

    // Update config (simple merge)
    if (body.config) {
      agent.config = { ...agent.config, ...body.config };
    }
    if (body.name) {
      agent.name = body.name;
    }

    return c.json(agent);
  });

  // Start agent
  app.post('/api/v1/agents/:id/start', async (c) => {
    const id = c.req.param('id');
    const agent = state.startAgent(id);

    if (!agent) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    return c.json({ agent });
  });

  // Stop agent
  app.post('/api/v1/agents/:id/stop', async (c) => {
    const id = c.req.param('id');
    const agent = state.stopAgent(id);

    if (!agent) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    return c.json({ agent, wasExecuting: false });
  });

  // Delete agent
  app.delete('/api/v1/agents/:id', async (c) => {
    const id = c.req.param('id');
    const deleted = state.deleteAgent(id);

    if (!deleted) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    return c.json({ deleted: true });
  });

  // List agents
  app.get('/api/v1/agents', async (c) => {
    const agents = state.listAgents();

    return c.json({
      agents,
      totalCount: agents.length,
    });
  });

  // Get agent logs (mock)
  app.get('/api/v1/agents/:id/logs', async (c) => {
    const id = c.req.param('id');
    const agent = state.getAgent(id);

    if (!agent) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    // Generate mock logs
    const logs = [
      { timestamp: Date.now() - 60000, level: 'INFO', message: 'Agent started' },
      { timestamp: Date.now() - 30000, level: 'INFO', message: 'Execution #1 started' },
      { timestamp: Date.now() - 25000, level: 'INFO', message: 'Execution #1 completed' },
    ];

    return c.json({ entries: logs });
  });

  // Get agent metrics (mock)
  app.get('/api/v1/agents/:id/metrics', async (c) => {
    const id = c.req.param('id');
    const agent = state.getAgent(id);

    if (!agent) {
      return c.json({ code: 'NOT_FOUND', message: 'Agent not found' }, 404);
    }

    return c.json({
      metrics: {
        totalExecutions: agent.state.executionCount,
        successfulExecutions: agent.state.executionCount,
        failedExecutions: 0,
        successRate: 1.0,
        avgExecutionTimeMs: 2500,
        p50ExecutionTimeMs: 2300,
        p95ExecutionTimeMs: 3500,
        p99ExecutionTimeMs: 4000,
        totalFeesPaid: '50000',
        avgFeePerExecution: '5000',
        avgSlippageBps: 25,
        maxSlippageBps: 45,
        totalNotional: agent.state.dailyNotional,
        avgNotionalPerExecution: '10000000',
      },
    });
  });
}
