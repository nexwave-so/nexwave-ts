import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction, ExecutionResult } from '../parser/types';
import { formatTable, formatStatus, formatId, formatRelativeTime, formatAmountFromSmallest } from '../../lib/output';

export async function executeIntentAction(
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
      case 'LIST_INTENTS': {
        const result = await client.intents.list({
          limit: data.limit || 20,
          states: data.states,
        });

        return {
          success: true,
          type: 'intents',
          data: result.intents,
          message: `Found ${result.intents.length} intent(s)`,
        };
      }

      case 'INTENT_STATUS': {
        const status = await client.intents.getStatus(data.intentId);
        return {
          success: true,
          type: 'intent-status',
          data: status,
          message: `Intent ${formatId(data.intentId)}: ${formatStatus(status.state)}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown intent action: ${actionType}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Intent action failed',
    };
  }
}
