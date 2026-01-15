import type { NexwaveClient } from '@nexwave/sdk';
import type { ParsedAction, ExecutionResult } from '../parser/types';
import { transformCliIntentToIntent, CliIntentSchema } from '../../schemas/intent';
import { transformCliAgentConfigToAgentConfig, CliAgentConfigSchema } from '../../schemas/agent';

export async function executeAgentAction(
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
      case 'CREATE_AGENT': {
        // Build agent config
        const cliConfig = {
          name: data.name || 'Unnamed Agent',
          intentTemplate: {
            action: { type: 'EXCHANGE' as const },
            inputs: [
              {
                symbol: data.fromAsset,
                amount: data.fromAmount,
                decimals: data.fromDecimals,
              },
            ],
            output: {
              symbol: data.toAsset,
              decimals: data.toDecimals,
            },
            constraints: {
              maxSlippageBps: data.maxSlippageBps || 100,
            },
            urgency: 'NORMAL' as const,
            deadlineSeconds: 120,
          },
          schedule: data.schedule,
          limits: data.limits,
        };

        const validation = CliAgentConfigSchema.safeParse(cliConfig);
        if (!validation.success) {
          return {
            success: false,
            error: `Validation failed: ${validation.error.errors[0]?.message}`,
          };
        }

        const { name, config } = transformCliAgentConfigToAgentConfig(validation.data);
        const agent = await client.agents.create({ name, config, startImmediately: data.start });

        return {
          success: true,
          data: {
            agentId: agent.id,
            name: agent.name,
            status: agent.status,
          },
          message: `Agent created: ${agent.name}`,
        };
      }

      case 'START_AGENT': {
        const agent = await client.agents.start(data.agentId);
        return {
          success: true,
          data: { agentId: agent.id, status: agent.status },
          message: `Agent ${data.agentId} started`,
        };
      }

      case 'STOP_AGENT': {
        const agent = await client.agents.stop(data.agentId);
        return {
          success: true,
          data: { agentId: agent.id, status: agent.status },
          message: `Agent ${data.agentId} stopped`,
        };
      }

      case 'DELETE_AGENT': {
        await client.agents.delete(data.agentId);
        return {
          success: true,
          message: `Agent ${data.agentId} deleted`,
        };
      }

      case 'LIST_AGENTS': {
        const result = await client.agents.list({
          status: data.status,
          limit: data.limit || 20,
        });

        return {
          success: true,
          type: 'agents',
          data: result.agents,
          message: `Found ${result.agents.length} agent(s)`,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown agent action: ${actionType}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Agent action failed',
    };
  }
}
