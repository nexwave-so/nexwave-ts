import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction, ExecutionResult } from '../parser/types';
import { IntentBuilder } from '@nexwave/sdk';

export async function executeSwap(
  action: ParsedAction,
  client: NexwaveClient
): Promise<ExecutionResult> {
  const data = action.data;
  
  if (!data) {
    return {
      success: false,
      error: 'Missing swap data',
    };
  }

  try {
    // Build intent
    const intent = new IntentBuilder()
      .exchange()
      .from(data.fromAsset, data.fromAmount, data.fromDecimals)
      .to(data.toAsset, data.toDecimals)
      .maxSlippage(data.maxSlippageBps)
      .deadline(60)
      .urgency(data.urgency || 'NORMAL')
      .build();

    // Submit
    const result = await client.intents.submit(intent);

    // Try to watch for completion (non-blocking)
    let finalResult: ExecutionResult = {
      success: true,
      data: {
        intentId: result.intentId,
        status: result.state,
      },
      message: `Intent submitted: ${result.intentId}`,
    };

    // Watch status updates (with timeout)
    try {
      const watchPromise = (async () => {
        for await (const event of client.intents.watchStatus(result.intentId)) {
          if (event.state === 'COMPLETED') {
            finalResult = {
              success: true,
              data: {
                intentId: result.intentId,
                status: 'COMPLETED',
              },
              message: 'Swap completed successfully',
            };
            break;
          }

          if (event.state === 'FAILED' || event.state === 'CANCELLED') {
            finalResult = {
              success: false,
              error: event.event?.message || 'Execution failed',
              data: { intentId: result.intentId },
            };
            break;
          }
        }
      })();

      // Wait up to 30 seconds for completion
      await Promise.race([
        watchPromise,
        new Promise((resolve) => setTimeout(resolve, 30000)),
      ]);
    } catch (watchError) {
      // If watching fails, just return the submission result
      // User can check status manually
    }

    return finalResult;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Swap failed',
    };
  }
}
