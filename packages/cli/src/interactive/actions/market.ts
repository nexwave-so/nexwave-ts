import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction, ExecutionResult } from '../parser/types';
import { getDecimals } from '../../lib/utils';
import { formatAmountFromSmallest } from '../../lib/output';

export async function executeMarketAction(
  action: ParsedAction,
  client: NexwaveClient
): Promise<ExecutionResult> {
  const { action: actionType, data } = action;

  if (!data) {
    return {
      success: false,
      error: 'Missing action data',
    };
  }

  try {
    switch (actionType) {
      case 'MARKET_QUOTE': {
        // For quote, we need an amount - use a default if not provided
        const amount = data.amount || '1000000000'; // Default to 1000 USDC equivalent
        const base = data.base || 'SOL';
        const quote = data.quote || 'USDC';
        
        // Build a simple intent for the quote
        const { IntentBuilder } = await import('@nexwave/sdk');
        const intent = new IntentBuilder()
          .exchange()
          .from(quote, amount, getDecimals(quote))
          .to(base, getDecimals(base))
          .maxSlippage(100)
          .deadline(60)
          .build();

        const result = await client.market.getQuote(intent);
        const quoteData = result.quote;

        return {
          success: true,
          type: 'quote',
          data: {
            base,
            quote,
            price: quoteData.price,
            outputAmount: formatAmountFromSmallest(quoteData.outputAmount, getDecimals(base)),
          },
          message: `${base}/${quote}: ${quoteData.price}`,
        };
      }

      case 'MARKET_STATE': {
        const state = await client.market.getState(
          data.base || 'SOL',
          data.quote || 'USDC'
        );

        return {
          success: true,
          type: 'market',
          data: state.state,
          message: `${data.base}/${data.quote}: ${state.state.midPrice}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown market action: ${actionType}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Market query failed',
    };
  }
}
