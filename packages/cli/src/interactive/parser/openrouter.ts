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

interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

/**
 * Get OpenRouter configuration from environment variables
 */
function getOpenRouterConfig(): OpenRouterConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  };
}

/**
 * Parse user input using OpenRouter API
 */
export async function parseWithOpenRouter(
  input: string,
  context: ParserContext
): Promise<ParsedAction> {
  const config = getOpenRouterConfig();
  
  if (!config) {
    return {
      action: 'ERROR',
      error: 'OPENROUTER_API_KEY not set. Set it to use natural language parsing, or use simple commands like "swap 100 USDC to SOL"',
      suggestions: [
        'swap 100 USDC to SOL',
        'show my agents',
        'price of SOL',
      ],
    };
  }

  try {
    const contextMessage = context.context.lastAction
      ? `\n\nLast action: ${JSON.stringify(context.context.lastAction)}`
      : '';

    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nexwave.so',
        'X-Title': 'Nexwave CLI',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `${input}${contextMessage}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return {
        action: 'ERROR',
        error: `API request failed: ${response.status}`,
        suggestions: [
          'swap 100 USDC to SOL',
          'show my agents',
          'create a DCA agent',
        ],
      };
    }

    const data = await response.json() as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        action: 'ERROR',
        error: 'No response from API',
      };
    }

    // Parse JSON from response
    let parsed: ParsedAction;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return {
          action: 'ERROR',
          error: 'Could not parse response as JSON',
        };
      }
    }

    // Validate that it's a ParsedAction
    if (!parsed.action) {
      return {
        action: 'ERROR',
        error: 'Invalid response format',
      };
    }

    return parsed as ParsedAction;
  } catch (error) {
    console.error('OpenRouter parse error:', error);
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
