import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { MockState } from '../state';
import { generateMockQuote } from '../mock-data/quotes';

export function createIntentHandlers(app: Hono, state: MockState) {
  // Submit intent
  app.post('/api/v1/intents', async (c) => {
    const body = await c.req.json();
    const { intent, simulateFirst = true, idempotencyKey } = body;

    if (!intent) {
      return c.json({ code: 'INVALID_ARGUMENT', message: 'Intent is required' }, 400);
    }

    // Validate basic structure
    if (!intent.action || !intent.inputs?.length || !intent.output) {
      return c.json(
        { code: 'INTENT_INVALID', message: 'Intent missing required fields' },
        400
      );
    }

    const stored = state.createIntent(intent);
    const quote = generateMockQuote(intent);

    return c.json({
      intentId: stored.id,
      state: stored.state,
      plan: {
        intentId: stored.id,
        steps: [
          {
            kind: 'SWAP',
            venue: 'mock-venue',
            parameters: {},
            expectedOutput: {
              asset: intent.output,
              amount: quote.outputAmount,
            },
          },
        ],
        cost: quote.cost,
        expiresAt: Date.now() + 30000,
      },
      quote,
      submittedAt: stored.createdAt,
    });
  });

  // Simulate intent
  app.post('/api/v1/intents/simulate', async (c) => {
    const body = await c.req.json();
    const { intent } = body;

    if (!intent) {
      return c.json({ code: 'INVALID_ARGUMENT', message: 'Intent is required' }, 400);
    }

    const quote = generateMockQuote(intent);

    return c.json({
      success: true,
      quote,
      plan: {
        intentId: intent.id ?? 'simulation',
        steps: [
          {
            kind: 'SWAP',
            venue: 'mock-venue',
            parameters: {},
          },
        ],
        cost: quote.cost,
        expiresAt: Date.now() + 30000,
      },
      warnings: [],
      estimatedCost: quote.cost,
      riskAssessment: {
        riskScore: 15,
        factors: [
          { type: 'LIQUIDITY', severity: 'low', message: 'Adequate liquidity available' },
        ],
      },
    });
  });

  // Validate intent
  app.post('/api/v1/intents/validate', async (c) => {
    const body = await c.req.json();
    const { intent } = body;

    const errors: Array<{ field: string; message: string }> = [];

    if (!intent.action) {
      errors.push({ field: 'action', message: 'Action is required' });
    }
    if (!intent.inputs?.length) {
      errors.push({ field: 'inputs', message: 'At least one input is required' });
    }
    if (!intent.output) {
      errors.push({ field: 'output', message: 'Output is required' });
    }
    if (!intent.deadline) {
      errors.push({ field: 'deadline', message: 'Deadline is required' });
    } else if (intent.deadline < Date.now()) {
      errors.push({ field: 'deadline', message: 'Deadline must be in the future' });
    }

    return c.json({
      valid: errors.length === 0,
      errors,
      warnings: [],
    });
  });

  // Get intent status
  app.get('/api/v1/intents/:id', async (c) => {
    const id = c.req.param('id');
    const intent = state.getIntent(id);

    if (!intent) {
      return c.json({ code: 'NOT_FOUND', message: 'Intent not found' }, 404);
    }

    return c.json({
      intentId: intent.id,
      state: intent.state,
      outcome: intent.outcome,
      events: intent.events,
      createdAt: intent.createdAt,
      completedAt: intent.completedAt,
    });
  });

  // Cancel intent
  app.post('/api/v1/intents/:id/cancel', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    const intent = state.cancelIntent(id);

    if (!intent) {
      return c.json({ code: 'NOT_FOUND', message: 'Intent not found' }, 404);
    }

    return c.json({
      cancelled: intent.state === 'CANCELLED',
      finalState: intent.state,
      message:
        intent.state === 'CANCELLED' ? 'Intent cancelled' : 'Intent already completed',
    });
  });

  // List intents
  app.get('/api/v1/intents', async (c) => {
    const limit = parseInt(c.req.query('limit') ?? '20');
    const cursor = c.req.query('cursor');
    const statesParam = c.req.query('states');
    const states = statesParam?.split(',') as string[] | undefined;

    const result = state.listIntents({ limit, cursor, states: states as any });

    return c.json({
      intents: result.intents.map((i) => ({
        id: i.id,
        action: i.intent.action.type,
        state: i.state,
        createdAt: i.createdAt,
        label: i.intent.metadata?.label,
        input: i.intent.inputs[0],
        output: i.outcome?.actualOutput,
      })),
      nextCursor: result.nextCursor,
      totalCount: result.intents.length,
    });
  });

  // Watch intent (SSE)
  app.get('/api/v1/intents/:id/watch', async (c) => {
    const id = c.req.param('id');
    const intent = state.getIntent(id);

    if (!intent) {
      return c.json({ code: 'NOT_FOUND', message: 'Intent not found' }, 404);
    }

    return streamSSE(c, async (stream) => {
      // Send current state first
      await stream.writeSSE({
        data: JSON.stringify({
          intentId: id,
          state: intent.state,
          event: intent.events[intent.events.length - 1],
          timestamp: Date.now(),
        }),
      });

      // If already terminal, close
      if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(intent.state)) {
        await stream.writeSSE({ data: '[DONE]' });
        return;
      }

      // Subscribe to updates
      const unsubscribe = state.watchIntent(id, async (event) => {
        await stream.writeSSE({ data: JSON.stringify(event) });

        if (
          ['COMPLETED', 'FAILED', 'CANCELLED'].includes((event as any).state)
        ) {
          await stream.writeSSE({ data: '[DONE]' });
        }
      });

      // Keep connection open
      await new Promise<void>((resolve) => {
        stream.onAbort(() => {
          unsubscribe();
          resolve();
        });
      });
    });
  });
}
