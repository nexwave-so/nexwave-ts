import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction, ExecutionResult } from '../parser/types';

export async function executeSystemAction(
  action: ParsedAction,
  client: NexwaveClient
): Promise<ExecutionResult> {
  const { action: actionType } = action;

  try {
    switch (actionType) {
      case 'SYSTEM_HEALTH': {
        const health = await client.system.health();
        return {
          success: true,
          type: 'status',
          data: health,
          message: `System is ${health.status}`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown system action: ${actionType}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'System query failed',
    };
  }
}
