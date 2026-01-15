import { Hono } from 'hono';
import type { MockState } from '../state';
import { generateMockQuote, getMockMarketState } from '../mock-data/quotes';

export function createMarketHandlers(app: Hono, state: MockState) {
  // Get market state
  app.get('/api/v1/markets/:base/:quote', async (c) => {
    const base = c.req.param('base');
    const quote = c.req.param('quote');

    const marketState = getMockMarketState(base, quote);

    return c.json({
      state: marketState,
      asOf: Date.now(),
    });
  });

  // Get quote
  app.post('/api/v1/quotes', async (c) => {
    const body = await c.req.json();
    const { intent, venue } = body;

    if (!intent) {
      return c.json({ code: 'INVALID_ARGUMENT', message: 'Intent is required' }, 400);
    }

    const quote = generateMockQuote(intent);

    return c.json({
      quote,
      venue: venue ?? 'mock-venue',
      expiresAt: Date.now() + 30000,
    });
  });

  // List venues
  app.get('/api/v1/venues', async (c) => {
    return c.json({
      venues: [
        {
          id: 'mock-venue',
          name: 'Mock Venue',
          type: 'HYBRID',
          chain: 'solana',
          supportedActions: ['EXCHANGE', 'LIMIT_ORDER', 'OPEN_POSITION'],
          available: true,
        },
        {
          id: 'mock-lending',
          name: 'Mock Lending Pool',
          type: 'LENDING',
          chain: 'solana',
          supportedActions: ['LEND', 'WITHDRAW'],
          available: true,
        },
      ],
    });
  });

  // List assets
  app.get('/api/v1/assets', async (c) => {
    return c.json({
      assets: [
        { symbol: 'SOL', decimals: 9, chain: 'solana' },
        { symbol: 'USDC', decimals: 6, chain: 'solana' },
        { symbol: 'USDT', decimals: 6, chain: 'solana' },
        { symbol: 'ETH', decimals: 18, chain: 'ethereum' },
        { symbol: 'BTC', decimals: 8, chain: 'bitcoin' },
      ],
    });
  });
}
