import type { ParsedAction, ParserContext } from './types';
import { parseWithRules } from './fallback';
import { parseWithOpenRouter } from './openrouter';

export async function parseUserInput(
  input: string,
  context: ParserContext
): Promise<ParsedAction> {
  // Try rule-based parsing first (fast, no API call)
  const ruleResult = parseWithRules(input);
  if (ruleResult) {
    return ruleResult;
  }

  // Fall back to OpenRouter for complex/ambiguous input
  const hasOpenRouterKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim().length > 0;
  if (hasOpenRouterKey) {
    return parseWithOpenRouter(input, context);
  }

  // No API key, return error with suggestions
  return {
    action: 'ERROR',
    error: "I didn't understand that. Try a simpler command, or set OPENROUTER_API_KEY for natural language parsing.",
    suggestions: [
      'swap 100 USDC to SOL',
      'show my agents',
      'price of SOL',
    ],
  };
}
