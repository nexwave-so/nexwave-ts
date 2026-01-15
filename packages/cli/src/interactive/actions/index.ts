import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction, ExecutionResult } from '../parser/types';
import { executeSwap } from './swap';
import { executeAgentAction } from './agent';
import { executeMarketAction } from './market';
import { executeSystemAction } from './system';
import { executeIntentAction } from './intent';

export async function executeAction(
  action: ParsedAction,
  client: NexwaveClient
): Promise<ExecutionResult> {
  switch (action.action) {
    case 'SWAP':
    case 'LIMIT_ORDER':
      return executeSwap(action, client);

    case 'CREATE_AGENT':
    case 'START_AGENT':
    case 'STOP_AGENT':
    case 'DELETE_AGENT':
    case 'LIST_AGENTS':
      return executeAgentAction(action, client);

    case 'LIST_INTENTS':
    case 'INTENT_STATUS':
      return executeIntentAction(action, client);

    case 'MARKET_QUOTE':
    case 'MARKET_STATE':
      return executeMarketAction(action, client);

    case 'SYSTEM_HEALTH':
      return executeSystemAction(action, client);

    case 'INFO':
      return { success: true, message: action.message };

    case 'ERROR':
      return { success: false, error: action.error, data: { suggestions: action.suggestions } };

    default:
      return { success: false, error: `Unknown action: ${action.action}` };
  }
}
