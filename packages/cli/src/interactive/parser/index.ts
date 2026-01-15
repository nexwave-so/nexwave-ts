import type { ParsedAction, ParserContext } from './types';
import { parseWithRules } from './fallback';
import { parseWithClaude } from './claude';

export async function parseUserInput(
  input: string,
  context: ParserContext
): Promise<ParsedAction> {
  // Try rule-based parsing first (fast, no API call)
  const ruleResult = parseWithRules(input);
  if (ruleResult) {
    return ruleResult;
  }

  // Fall back to Claude for complex/ambiguous input
  if (process.env.ANTHROPIC_API_KEY) {
    return parseWithClaude(input, context);
  }

  // No API key, return error with suggestions
  return {
    action: 'ERROR',
    error: "I didn't understand that. Try a simpler command.",
    suggestions: [
      'swap 100 USDC to SOL',
      'show my agents',
      'price of SOL',
    ],
  };
}
