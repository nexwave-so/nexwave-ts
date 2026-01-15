import { z } from 'zod';
import { IntentSchema as BaseIntentSchema, type Intent } from '@nexwave/types';

/**
 * User-friendly intent schema for CLI input (YAML/JSON)
 * This transforms to the actual Intent format expected by the SDK
 */
export const CliIntentSchema = z.object({
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('EXCHANGE') }),
    z.object({
      type: z.literal('LIMIT_ORDER'),
      side: z.enum(['BUY', 'SELL']),
      limitPrice: z.string(),
    }),
    z.object({
      type: z.literal('OPEN_POSITION'),
      leverage: z.object({
        numerator: z.number().int().min(1).max(100),
        denominator: z.number().int().min(1).max(100),
      }),
      direction: z.enum(['LONG', 'SHORT', 'NEUTRAL']),
      range: z
        .object({
          lower: z.string(),
          upper: z.string(),
        })
        .optional(),
    }),
    z.object({
      type: z.literal('CLOSE_POSITION'),
      positionId: z.string(),
    }),
    z.object({ type: z.literal('LEND') }),
    z.object({
      type: z.literal('WITHDRAW'),
      positionId: z.string(),
    }),
  ]),
  inputs: z
    .array(
      z.object({
        symbol: z.string().min(1).max(20),
        amount: z.string().regex(/^\d+$/, 'Amount must be a numeric string'),
        decimals: z.number().int().min(0).max(18),
        address: z.string().optional(),
      })
    )
    .min(1),
  output: z.object({
    symbol: z.string().min(1).max(20),
    decimals: z.number().int().min(0).max(18),
    address: z.string().optional(),
  }),
  constraints: z
    .object({
      maxSlippageBps: z.number().int().min(0).max(10000).default(100),
      maxFee: z.string().regex(/^\d+$/).optional(),
      maxNotional: z.string().regex(/^\d+$/).optional(),
      minOutput: z.string().regex(/^\d+$/).optional(),
      retryPolicy: z
        .object({
          maxRetries: z.number().int().min(0).max(10).default(3),
          backoffMs: z.number().int().min(0).default(500),
          backoffMultiplier: z.number().min(1).max(5).default(2.0),
        })
        .optional(),
      priceLimit: z
        .object({
          maxPrice: z.string().regex(/^\d+$/).optional(),
          minPrice: z.string().regex(/^\d+$/).optional(),
        })
        .optional(),
      stopLoss: z.string().regex(/^\d+$/).optional(),
      takeProfit: z.string().regex(/^\d+$/).optional(),
    })
    .default({}),
  urgency: z.enum(['LOW', 'NORMAL', 'HIGH']).default('NORMAL'),
  deadlineSeconds: z.number().int().positive().default(60), // User-friendly: seconds
  metadata: z
    .object({
      label: z.string().optional(),
      correlationId: z.string().optional(),
      tags: z.record(z.string()).optional(),
    })
    .optional(),
});

export type CliIntent = z.infer<typeof CliIntentSchema>;

/**
 * Transform CLI intent format to SDK Intent format
 */
export function transformCliIntentToIntent(cliIntent: CliIntent): Intent {
  const deadline = Date.now() + cliIntent.deadlineSeconds * 1000;

  return {
    action: cliIntent.action,
    inputs: cliIntent.inputs.map((input) => ({
      asset: {
        symbol: input.symbol,
        decimals: input.decimals,
        address: input.address,
      },
      amount: input.amount,
    })),
    output: {
      symbol: cliIntent.output.symbol,
      decimals: cliIntent.output.decimals,
      address: cliIntent.output.address,
    },
    constraints: {
      maxSlippageBps: cliIntent.constraints.maxSlippageBps,
      maxFee: cliIntent.constraints.maxFee,
      maxNotional: cliIntent.constraints.maxNotional,
      minOutput: cliIntent.constraints.minOutput,
      retryPolicy: cliIntent.constraints.retryPolicy || {
        maxRetries: 3,
        backoffMs: 500,
        backoffMultiplier: 2,
      },
      priceLimit: cliIntent.constraints.priceLimit,
      stopLoss: cliIntent.constraints.stopLoss,
      takeProfit: cliIntent.constraints.takeProfit,
    },
    urgency: cliIntent.urgency,
    deadline,
    metadata: cliIntent.metadata,
  };
}
