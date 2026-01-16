import type { ParsedAction } from './types';

// Fast regex patterns for common commands
const PATTERNS = {
  // swap 1000 USDC to SOL
  // swap 1000 USDC for SOL max 0.5% slippage
  swap: /^swap\s+(\d+(?:\.\d+)?)\s*(\w+)\s+(?:to|for|->)\s*(\w+)(?:\s+(?:max\s+)?(\d+(?:\.\d+)?)\s*%?\s*(?:slippage)?)?/i,
  
  // show agents, list agents, my agents
  listAgents: /^(?:show|list|my)\s+(?:running\s+)?agents?$/i,
  
  // stop agent agt_xxx
  stopAgent: /^stop\s+(?:agent\s+)?(\w+)/i,
  
  // start agent agt_xxx
  startAgent: /^start\s+(?:agent\s+)?(\w+)/i,
  
  // price of SOL, SOL price, what's SOL
  price: /^(?:price\s+(?:of\s+)?|what'?s\s+(?:the\s+)?(?:price\s+(?:of\s+)?)?|how\s+much\s+is\s+)(\w+)(?:\s*\/?\s*(\w+))?/i,
  
  // show intents, list intents, my intents
  listIntents: /^(?:show|list|my)\s+(?:recent\s+)?intents?$/i,
  
  // status of int_xxx, intent int_xxx
  intentStatus: /^(?:status\s+(?:of\s+)?|intent\s+)(\w+)/i,
  
  // health, status
  health: /^(?:health|status|system\s+(?:health|status))$/i,
};

const DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  BONK: 5,
  JUP: 6,
  RAY: 6,
  ETH: 18,
  BTC: 8,
};

export function parseWithRules(input: string): ParsedAction | null {
  const trimmed = input.trim();

  // Try swap pattern
  const swapMatch = trimmed.match(PATTERNS.swap);
  if (swapMatch) {
    const [, amount, from, to, slippage] = swapMatch;
    const fromDecimals = DECIMALS[from.toUpperCase()] ?? 9;
    const toDecimals = DECIMALS[to.toUpperCase()] ?? 9;
    const fromAmount = Math.round(parseFloat(amount) * Math.pow(10, fromDecimals));
    const slippageBps = slippage ? Math.round(parseFloat(slippage) * 100) : 50;

    return {
      action: 'SWAP',
      requiresConfirmation: true,
      data: {
        fromAsset: from.toUpperCase(),
        fromAmount: fromAmount.toString(),
        fromDecimals,
        toAsset: to.toUpperCase(),
        toDecimals,
        maxSlippageBps: slippageBps,
        urgency: 'NORMAL',
      },
      summary: `Swap ${amount} ${from.toUpperCase()} for ${to.toUpperCase()} with ${slippageBps / 100}% max slippage`,
    };
  }

  // List agents
  if (PATTERNS.listAgents.test(trimmed)) {
    return {
      action: 'LIST_AGENTS',
      requiresConfirmation: false,
      data: {},
      summary: 'List agents',
    };
  }

  // Stop agent
  const stopMatch = trimmed.match(PATTERNS.stopAgent);
  if (stopMatch) {
    return {
      action: 'STOP_AGENT',
      requiresConfirmation: true,
      data: { agentId: stopMatch[1] },
      summary: `Stop agent ${stopMatch[1]}`,
    };
  }

  // Start agent
  const startMatch = trimmed.match(PATTERNS.startAgent);
  if (startMatch) {
    return {
      action: 'START_AGENT',
      requiresConfirmation: true,
      data: { agentId: startMatch[1] },
      summary: `Start agent ${startMatch[1]}`,
    };
  }

  // Price query
  const priceMatch = trimmed.match(PATTERNS.price);
  if (priceMatch) {
    return {
      action: 'MARKET_QUOTE',
      requiresConfirmation: false,
      data: {
        base: priceMatch[1].toUpperCase(),
        quote: (priceMatch[2] || 'USDC').toUpperCase(),
      },
      summary: `Get ${priceMatch[1].toUpperCase()} price`,
    };
  }

  // List intents
  if (PATTERNS.listIntents.test(trimmed)) {
    return {
      action: 'LIST_INTENTS',
      requiresConfirmation: false,
      data: {},
      summary: 'List recent intents',
    };
  }

  // Intent status
  const statusMatch = trimmed.match(PATTERNS.intentStatus);
  if (statusMatch) {
    return {
      action: 'INTENT_STATUS',
      requiresConfirmation: false,
      data: { intentId: statusMatch[1] },
      summary: `Check status of ${statusMatch[1]}`,
    };
  }

  // Health check
  if (PATTERNS.health.test(trimmed)) {
    return {
      action: 'SYSTEM_HEALTH',
      requiresConfirmation: false,
      data: {},
      summary: 'Check system health',
    };
  }

  // No match - return null to fall through to OpenRouter
  return null;
}
