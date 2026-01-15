import chalk from 'chalk';
import yaml from 'yaml';
import { getConfigManager } from './config';

export type OutputFormat = 'table' | 'json' | 'yaml';

/**
 * Format output based on configured format
 */
export function formatOutput(data: unknown, format?: OutputFormat): string {
  const config = getConfigManager();
  const outputFormat = format || (config.get<OutputFormat>('output.format') || 'table');

  switch (outputFormat) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'yaml':
      return yaml.stringify(data);
    case 'table':
    default:
      // For table format, return the data as-is (caller should format it)
      return JSON.stringify(data, null, 2);
  }
}

/**
 * Format a table from array data
 */
export function formatTable(
  data: Array<Record<string, unknown>>,
  columns?: Array<{ key: string; label: string; width?: number | undefined }>
): string {
  if (data.length === 0) {
    return 'No data to display';
  }

  // Auto-detect columns if not provided
  const cols: Array<{ key: string; label: string; width?: number }> = columns || Object.keys(data[0]).map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
  }));

  // Calculate column widths
  const widths = cols.map((col) => {
    const specifiedWidth = col.width;
    const calculatedWidth = Math.max(
      col.label.length,
      ...data.map((row) => {
        const value = row[col.key];
        return value ? String(value).length : 0;
      })
    );
    const width = specifiedWidth ?? calculatedWidth;
    return Math.min(width, 50); // Cap at 50 chars
  });

  // Build header
  const header = cols
    .map((col, i) => col.label.padEnd(widths[i]))
    .join(' │ ');

  const separator = cols.map((_, i) => '─'.repeat(widths[i])).join('─┼─');

  // Build rows
  const rows = data.map((row) =>
    cols
      .map((col, i) => {
        const value = row[col.key];
        const str = value !== null && value !== undefined ? String(value) : '';
        return str.padEnd(widths[i]).substring(0, widths[i]);
      })
      .join(' │ ')
  );

  return [
    `┌─${'─'.repeat(header.length - 2)}─┐`,
    `│ ${header} │`,
    `├─${separator}─┤`,
    ...rows.map((row) => `│ ${row} │`),
    `└─${'─'.repeat(header.length - 2)}─┘`,
  ].join('\n');
}

/**
 * Format status badge with color
 */
export function formatStatus(status: string): string {
  const statusColors: Record<string, (text: string) => string> = {
    PENDING: chalk.yellow,
    PLANNING: chalk.cyan,
    SIMULATING: chalk.cyan,
    EXECUTING: chalk.magenta,
    CONFIRMED: chalk.green,
    SUCCESS: chalk.green,
    FAILED: chalk.red,
    CANCELLED: chalk.gray,
    RUNNING: chalk.green,
    STOPPED: chalk.gray,
    PAUSED: chalk.yellow,
  };

  const colorFn = statusColors[status.toUpperCase()] || chalk.white;
  const symbols: Record<string, string> = {
    PENDING: '●',
    PLANNING: '○',
    SIMULATING: '○',
    EXECUTING: '▶',
    CONFIRMED: '✓',
    SUCCESS: '✓',
    FAILED: '✗',
    CANCELLED: '○',
    RUNNING: '▶',
    STOPPED: '■',
    PAUSED: '⏸',
  };

  const symbol = symbols[status.toUpperCase()] || '●';
  return colorFn(`${symbol} ${status}`);
}

/**
 * Format success message
 */
export function success(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * Format error message
 */
export function error(message: string): string {
  return chalk.red(`✗ ${message}`);
}

/**
 * Format warning message
 */
export function warning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format info message
 */
export function info(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format ID (truncate middle)
 */
export function formatId(id: string, length: number = 12): string {
  if (id.length <= length) return id;
  const start = Math.floor(length / 2);
  const end = id.length - (length - start - 3);
  return `${id.substring(0, start)}...${id.substring(end)}`;
}

/**
 * Format amount with decimals
 */
export function formatAmount(amount: string | number, decimals: number, symbol?: string): string {
  const num = typeof amount === 'string' ? BigInt(amount) : BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const fraction = num % divisor;
  
  let result = whole.toString();
  if (fraction > 0n) {
    const fracStr = fraction.toString().padStart(decimals, '0');
    result += '.' + fracStr.replace(/0+$/, '');
  }
  
  if (symbol) {
    result += ` ${symbol}`;
  }
  
  return result;
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | Date | number): string {
  const now = new Date();
  const then = typeof date === 'number' ? new Date(date) : typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return `${diffSec} sec ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  
  return then.toLocaleDateString();
}

/**
 * Format amount from smallest units to human-readable
 */
export function formatAmountFromSmallest(amount: string, decimals: number): string {
  const padded = amount.padStart(decimals + 1, '0');
  const whole = padded.slice(0, -decimals) || '0';
  const frac = padded.slice(-decimals);
  // Remove trailing zeros from fraction
  const trimmedFrac = frac.replace(/0+$/, '');
  return trimmedFrac ? `${Number(whole).toLocaleString()}.${trimmedFrac}` : Number(whole).toLocaleString();
}
