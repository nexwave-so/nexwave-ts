import type {
  Asset,
  MarketState,
  MarketUpdate,
  Venue,
  Intent,
  Timestamp,
} from '@nexwave/types';
import type { RestTransport } from '../transport/rest';
import type { Quote } from './intents';

// ─── Request/Response Types ─────────────────────────────────────────────────

export interface AssetPair {
  base: string;
  quote: string;
}

export interface MarketStateResponse {
  state: MarketState;
  asOf: Timestamp;
}

export interface QuoteResponse {
  quote: Quote;
  venue: string;
  expiresAt: Timestamp;
}

// ─── Market Service ─────────────────────────────────────────────────────────

export class MarketService {
  constructor(private transport: RestTransport) {}

  /**
   * Get current market state for an asset pair.
   */
  async getState(
    base: Asset | string,
    quote: Asset | string,
    venue?: string
  ): Promise<MarketStateResponse> {
    const baseSymbol = typeof base === 'string' ? base : base.symbol;
    const quoteSymbol = typeof quote === 'string' ? quote : quote.symbol;

    const params = new URLSearchParams();
    if (venue) params.set('venue', venue);

    const query = params.toString();
    return this.transport.request<MarketStateResponse>({
      method: 'GET',
      path: `/markets/${baseSymbol}/${quoteSymbol}${query ? `?${query}` : ''}`,
    });
  }

  /**
   * Get quote for an intent.
   */
  async getQuote(intent: Intent, venue?: string): Promise<QuoteResponse> {
    return this.transport.request<QuoteResponse>({
      method: 'POST',
      path: '/quotes',
      body: { intent, venue },
    });
  }

  /**
   * Watch market updates (streaming).
   */
  async *watchMarket(pairs: AssetPair[]): AsyncIterable<MarketUpdate> {
    const pairsParam = pairs.map((p) => `${p.base}-${p.quote}`).join(',');
    yield* this.transport.stream<MarketUpdate>(`/markets/watch?pairs=${pairsParam}`);
  }

  /**
   * List available venues.
   */
  async listVenues(chain?: string): Promise<Venue[]> {
    const params = new URLSearchParams();
    if (chain) params.set('chain', chain);

    const query = params.toString();
    const response = await this.transport.request<{ venues: Venue[] }>({
      method: 'GET',
      path: `/venues${query ? `?${query}` : ''}`,
    });
    return response.venues;
  }

  /**
   * List supported assets.
   */
  async listAssets(chain?: string): Promise<Asset[]> {
    const params = new URLSearchParams();
    if (chain) params.set('chain', chain);

    const query = params.toString();
    const response = await this.transport.request<{ assets: Asset[] }>({
      method: 'GET',
      path: `/assets${query ? `?${query}` : ''}`,
    });
    return response.assets;
  }
}
