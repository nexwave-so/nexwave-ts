import chalk from 'chalk';
import {
  NexwaveError,
  ValidationError,
  ExecutionError,
  TransportError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
} from '@nexwave/sdk';
import { error, warning, info } from './output';

/**
 * Handle and display errors consistently
 */
export function handleError(err: unknown, verbose: boolean = false): void {
  if (err instanceof AuthenticationError) {
    console.error(error('Authentication failed'));
    console.error(`  ${err.message}`);
    console.error('');
    console.error(info('Run "nexwave auth login" to authenticate.'));
    process.exit(1);
  }

  if (err instanceof ValidationError) {
    console.error(error('Validation failed'));
    console.error(`  ${err.message}`);
    
    if (err.errors && err.errors.length > 0) {
      console.error('');
      console.error('Errors:');
      err.errors.forEach((e) => {
        console.error(`  • ${e.field}: ${e.message}`);
      });
    }
    
    if (verbose && err.stack) {
      console.error('');
      console.error(chalk.gray(err.stack));
    }
    
    process.exit(2);
  }

  if (err instanceof ExecutionError) {
    console.error(error('Execution failed'));
    console.error(`  Code: ${err.code}`);
    console.error(`  ${err.message}`);
    
    if (err.details) {
      console.error('');
      console.error('Details:');
      Object.entries(err.details).forEach(([key, value]) => {
        console.error(`  • ${key}: ${JSON.stringify(value)}`);
      });
    }
    
    // Provide suggestions based on error code
    if (err.code === 'SLIPPAGE_EXCEEDED') {
      console.error('');
      console.error(warning('Suggestions:'));
      console.error('  • Increase maxSlippageBps in constraints');
      console.error('  • Reduce trade size');
      console.error('  • Try during lower volatility periods');
      console.error('');
      console.error(info('Docs: https://docs.nexwave.so/errors/slippage-exceeded'));
    }
    
    if (verbose && err.stack) {
      console.error('');
      console.error(chalk.gray(err.stack));
    }
    
    process.exit(1);
  }

  if (err instanceof RateLimitError) {
    console.error(error('Rate limit exceeded'));
    console.error(`  ${err.message}`);
    console.error('');
    console.error(info('Please wait before retrying.'));
    process.exit(1);
  }

  if (err instanceof NotFoundError) {
    console.error(error('Resource not found'));
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  if (err instanceof TransportError) {
    console.error(error('Network error'));
    console.error(`  ${err.message}`);
    console.error('');
    console.error(info('Check your internet connection and API endpoint.'));
    
    if (verbose && err.stack) {
      console.error('');
      console.error(chalk.gray(err.stack));
    }
    
    process.exit(1);
  }

  if (err instanceof NexwaveError) {
    console.error(error('Nexwave error'));
    console.error(`  Code: ${err.code}`);
    console.error(`  ${err.message}`);
    
    if (verbose && err.stack) {
      console.error('');
      console.error(chalk.gray(err.stack));
    }
    
    process.exit(1);
  }

  if (err instanceof Error) {
    console.error(error('Unexpected error'));
    console.error(`  ${err.message}`);
    
    if (verbose && err.stack) {
      console.error('');
      console.error(chalk.gray(err.stack));
    }
    
    process.exit(1);
  }

  // Unknown error
  console.error(error('Unknown error occurred'));
  if (verbose) {
    console.error(JSON.stringify(err, null, 2));
  }
  process.exit(1);
}

/**
 * Handle Ctrl+C gracefully
 */
export function setupGracefulShutdown(cleanup?: () => Promise<void>): void {
  const shutdown = async (signal: string) => {
    console.log('\n');
    if (cleanup) {
      try {
        await cleanup();
      } catch (err) {
        // Ignore cleanup errors
      }
    }
    process.exit(130); // 130 = SIGINT
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
