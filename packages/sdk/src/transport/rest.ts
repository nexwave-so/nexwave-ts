import type { ClientConfig } from '../config';
import {
  AuthenticationError,
  RateLimitError,
  TransportError,
  NexwaveError,
} from '../errors';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  timeout?: number;
}

export class RestTransport {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseUrl = config.endpoint.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}/api/v1${options.path}`;
    const timeout = options.timeout ?? this.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof NexwaveError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TransportError(`Request timeout after ${timeout}ms`);
        }
        throw new TransportError(error.message, error);
      }

      throw new TransportError('Unknown transport error');
    }
  }

  private async handleError(response: Response): Promise<never> {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;

    switch (response.status) {
      case 401:
        throw new AuthenticationError();
      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '1000');
        throw new RateLimitError(retryAfter);
      default:
        throw new NexwaveError(
          (body.message as string) ?? `HTTP ${response.status}`,
          (body.code as string) ?? 'UNKNOWN',
          response.status >= 500
        );
    }
  }

  async *stream<T>(path: string): AsyncIterable<T> {
    const url = `${this.baseUrl}/api/v1${path}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new TransportError('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            yield JSON.parse(data) as T;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
