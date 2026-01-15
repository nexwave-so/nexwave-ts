import type { ParsedAction, ParserContext } from './types';

const SYSTEM_PROMPT = `You are a DeFi intent parser for Nexwave. Parse natural language into structured actions.

Available actions:
1. SWAP - Exchange one token for another
2. LIMIT_ORDER - Place a limit order
3. CREATE_AGENT - Create an autonomous agent
4. START_AGENT - Start an agent
5. STOP_AGENT - Stop an agent
6. DELETE_AGENT - Delete an agent
7. LIST_AGENTS - List all agents
8. LIST_INTENTS - List recent intents
9. INTENT_STATUS - Check intent status
10. MARKET_QUOTE - Get price quote
11. MARKET_STATE - Get market state
12. SYSTEM_HEALTH - Check system health

Token decimals reference:
- SOL: 9
- USDC: 6
- USDT: 6
- BONK: 5

Respond ONLY with valid JSON matching this schema:

For SWAP:
{
  "action": "SWAP",
  "requiresConfirmation": true,
  "data": {
    "fromAsset": "USDC",
    "fromAmount": "1000000000",
    "fromDecimals": 6,
    "toAsset": "SOL",
    "toDecimals": 9,
    "maxSlippageBps": 50,
    "urgency": "NORMAL"
  },
  "summary": "Swap 1,000 USDC for SOL with 0.5% max slippage"
}

For CREATE_AGENT:
{
  "action": "CREATE_AGENT",
  "requiresConfirmation": true,
  "data": {
    "name": "Daily SOL DCA",
    "fromAsset": "USDC",
    "fromAmount": "50000000",
    "fromDecimals": 6,
    "toAsset": "SOL",
    "toDecimals": 9,
    "schedule": {
      "cron": "0 12 * * *"
    },
    "maxSlippageBps": 100,
    "limits": {
      "maxExecutionsPerDay": 1,
      "maxDailyNotional": "50000000"
    }
  },
  "summary": "Create agent: Buy $50 SOL daily at 12:00 UTC"
}

For LIST_AGENTS:
{
  "action": "LIST_AGENTS",
  "requiresConfirmation": false,
  "data": {
    "status": "RUNNING"
  },
  "summary": "List running agents"
}

For STOP_AGENT:
{
  "action": "STOP_AGENT",
  "requiresConfirmation": true,
  "data": {
    "agentId": "agt_xxx",
    "agentName": "Daily SOL DCA"
  },
  "summary": "Stop agent: Daily SOL DCA"
}

For MARKET_QUOTE:
{
  "action": "MARKET_QUOTE",
  "requiresConfirmation": false,
  "data": {
    "base": "SOL",
    "quote": "USDC"
  },
  "summary": "Get SOL/USDC price"
}

For errors or unclear requests:
{
  "action": "ERROR",
  "error": "I didn't understand. Try: 'swap 100 USDC to SOL'",
  "suggestions": ["swap 100 USDC to SOL", "show my agents", "create a DCA agent"]
}

For informational responses (greetings, questions about capabilities):
{
  "action": "INFO",
  "message": "I can help you swap tokens, create trading agents, and more. Try 'swap 100 USDC to SOL' or 'create a weekly DCA agent'."
}

Context from conversation:
- If user says "the SOL agent" or "that agent", look at lastAction for the agent ID
- If user says "do it again" or "repeat", reference the lastAction

Parse amounts to smallest units:
- "1000 USDC" = "1000000000" (1000 * 10^6)
- "100 SOL" = "100000000000" (100 * 10^9)
- "$50" or "50 dollars" with USDC = "50000000"

Parse slippage:
- "0.5%" or "0.5% slippage" = 50 bps
- "1% max" = 100 bps
- Default to 50 bps if not specified for swaps

Parse schedules:
- "every day at noon" = "0 12 * * *"
- "every Monday at 9am" = "0 9 * * MON"
- "hourly" = intervalMs: 3600000
- "every 4 hours" = intervalMs: 14400000`;

export async function parseWithClaude(
  input: string,
  context: ParserContext
): Promise<ParsedAction> {
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      action: 'ERROR',
      error: 'ANTHROPIC_API_KEY not set. Set it to use natural language parsing, or use simple commands like "swap 100 USDC to SOL"',
      suggestions: [
        'swap 100 USDC to SOL',
        'show my agents',
        'price of SOL',
      ],
    };
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const contextMessage = context.context.lastAction
      ? `\n\nLast action: ${JSON.stringify(context.context.lastAction)}`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${input}${contextMessage}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return { action: 'ERROR', error: 'Unexpected response type' };
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { action: 'ERROR', error: 'Could not parse response' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as ParsedAction;
  } catch (error) {
    console.error('Claude parse error:', error);
    return {
      action: 'ERROR',
      error: 'Failed to understand. Try being more specific.',
      suggestions: [
        'swap 100 USDC to SOL',
        'show my agents',
        'create a DCA agent',
      ],
    };
  }
}
