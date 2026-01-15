import { z } from 'zod';
import { CliIntentSchema } from './intent';
import type { AgentConfig } from '@nexwave/types';

/**
 * User-friendly agent config schema for CLI input (YAML/JSON)
 * This transforms to the actual AgentConfig format expected by the SDK
 */
export const CliAgentConfigSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  intentTemplate: CliIntentSchema,
  schedule: z
    .object({
      once: z.boolean().optional(),
      intervalMs: z.number().int().positive().optional(),
      cron: z.string().optional(),
      triggerOnly: z.boolean().optional(),
    })
    .refine(
      (data) => {
        const count = [
          data.once,
          data.intervalMs,
          data.cron,
          data.triggerOnly,
        ].filter((v) => v !== undefined).length;
        return count <= 1;
      },
      { message: 'Only one schedule type allowed (once, intervalMs, cron, or triggerOnly)' }
    )
    .optional(),
  limits: z
    .object({
      maxExecutionsPerDay: z.number().int().positive().optional(),
      maxDailyNotional: z.string().regex(/^\d+$/).optional(),
      maxSingleNotional: z.string().regex(/^\d+$/).optional(),
      maxConcurrent: z.number().int().positive().optional(),
      circuitBreakerThreshold: z.number().int().positive().optional(),
    })
    .optional(),
  triggers: z
    .array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('price'),
          asset: z.object({
            symbol: z.string(),
            decimals: z.number().int().min(0).max(18),
          }),
          threshold: z.string().regex(/^\d+$/),
          condition: z.enum(['ABOVE', 'BELOW', 'CROSSES_ABOVE', 'CROSSES_BELOW']),
        }),
        z.object({
          type: z.literal('time'),
          at: z.number().int().positive(),
        }),
        z.object({
          type: z.literal('event'),
          eventType: z.string(),
          filters: z.record(z.string()).optional(),
        }),
      ])
    )
    .optional(),
  adapters: z.array(z.string()).optional(),
});

export type CliAgentConfig = z.infer<typeof CliAgentConfigSchema>;

/**
 * Transform CLI agent config format to SDK AgentConfig format
 */
export function transformCliAgentConfigToAgentConfig(
  cliConfig: CliAgentConfig
): { name: string; config: AgentConfig; description?: string } {
  // Import dynamically to avoid circular dependency
  const { transformCliIntentToIntent } = require('./intent');
  const intent = transformCliIntentToIntent(cliConfig.intentTemplate);

  return {
    name: cliConfig.name,
    description: cliConfig.description,
    config: {
      intentTemplate: intent,
      schedule: cliConfig.schedule,
      limits: cliConfig.limits,
      triggers: cliConfig.triggers,
      adapters: cliConfig.adapters,
    },
  };
}
