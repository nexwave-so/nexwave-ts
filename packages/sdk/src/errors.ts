import type { ExecutionState } from '@nexwave/types';

/** Base error for all Nexwave errors */
export class NexwaveError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NexwaveError';
  }
}

/** Validation errors (invalid intent, constraints, etc.) */
export class ValidationError extends NexwaveError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', false, { errors });
    this.name = 'ValidationError';
  }
}

/** Execution errors (simulation failed, slippage exceeded, etc.) */
export class ExecutionError extends NexwaveError {
  constructor(
    message: string,
    code: string,
    public readonly state: ExecutionState,
    retryable: boolean = false
  ) {
    super(message, code, retryable, { state });
    this.name = 'ExecutionError';
  }
}

/** Transport errors (connection failed, timeout, etc.) */
export class TransportError extends NexwaveError {
  constructor(message: string, public readonly cause?: Error) {
    super(message, 'TRANSPORT_ERROR', true, { cause: cause?.message });
    this.name = 'TransportError';
  }
}

/** Authentication errors */
export class AuthenticationError extends NexwaveError {
  constructor(message: string = 'Invalid or missing API key') {
    super(message, 'UNAUTHENTICATED', false);
    this.name = 'AuthenticationError';
  }
}

/** Rate limit errors */
export class RateLimitError extends NexwaveError {
  constructor(public readonly retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`, 'RATE_LIMITED', true, {
      retryAfterMs,
    });
    this.name = 'RateLimitError';
  }
}

/** Not found errors */
export class NotFoundError extends NexwaveError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', false, { resource, id });
    this.name = 'NotFoundError';
  }
}
