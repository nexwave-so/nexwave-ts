/**
 * Shared utility functions
 */

/**
 * Parse dot-notation path (e.g., "default.network")
 */
export function parsePath(path: string): string[] {
  return path.split('.');
}

/**
 * Deep get value from object by path
 */
export function getByPath(obj: any, path: string[]): unknown {
  let current = obj;
  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Deep set value in object by path
 */
export function setByPath(obj: any, path: string[], value: unknown): void {
  const lastKey = path.pop()!;
  let current = obj;
  
  for (const key of path) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Check if running in TTY (interactive terminal)
 */
export function isTTY(): boolean {
  return process.stdout.isTTY && process.stdin.isTTY;
}

/**
 * Get terminal width
 */
export function getTerminalWidth(): number {
  return process.stdout.columns || 80;
}

/**
 * Parse YAML or JSON from file or stdin
 */
export async function parseInput(input: string | undefined): Promise<unknown> {
  if (!input || input === '-') {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString('utf8');
    return parseContent(content);
  }
  
  // Read from file
  const fs = await import('fs/promises');
  const content = await fs.readFile(input, 'utf8');
  return parseContent(content);
}

/**
 * Parse content as YAML or JSON
 */
function parseContent(content: string): unknown {
  const trimmed = content.trim();
  
  // Try JSON first
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // Fall through to YAML
    }
  }
  
  // Try YAML
  try {
    // Use dynamic import for yaml (it's a dependency)
    const yaml = require('yaml');
    return yaml.parse(trimmed);
  } catch (err) {
    throw new Error(`Failed to parse input as JSON or YAML: ${err}`);
  }
}

/**
 * Token decimals lookup
 */
const DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  BONK: 5,
  JUP: 6,
  RAY: 6,
  SRM: 6,
  FIDA: 6,
  KIN: 5,
  COPE: 6,
  STEP: 9,
  MEDIA: 6,
  ROPE: 9,
  ALEPH: 6,
  TULIP: 6,
  SLRS: 6,
  PORT: 6,
  ATLAS: 8,
  POLIS: 8,
  SAMO: 9,
  LIQ: 8,
  mSOL: 9,
  stSOL: 9,
  scnSOL: 9,
  ETH: 18,
  BTC: 8,
};

/**
 * Get decimals for a token symbol
 */
export function getDecimals(symbol: string): number {
  return DECIMALS[symbol.toUpperCase()] ?? 9;
}

/**
 * Parse amount string (e.g., "1000.5") to smallest units string
 */
export function parseAmount(amount: string, symbol: string): string {
  const decimals = getDecimals(symbol);
  const [whole, frac = ''] = amount.split('.');
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals);
  return whole + paddedFrac;
}
