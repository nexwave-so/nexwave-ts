import { ClientConfigSchema, type ClientConfig, DEFAULT_CONFIG } from './config';
import { RestTransport } from './transport/rest';
import { IntentService } from './services/intents';
import { AgentService } from './services/agents';
import { ExecutionService } from './services/execution';
import { MarketService } from './services/market';
import { SystemService } from './services/system';
import { ValidationError } from './errors';
import type { HealthResponse } from '@nexwave/types';

/**
 * Main client for interacting with the Nexwave Runtime API.
 *
 * @example
 * ```ts
 * const client = new NexwaveClient({
 *   endpoint: 'http://localhost:8080',
 *   apiKey: 'nxw_test_xxxx',
 * });
 *
 * const result = await client.intents.submit(intent);
 * ```
 */
export class NexwaveClient {
  private config: ClientConfig;
  private transport: RestTransport;

  // Services
  public readonly intents: IntentService;
  public readonly agents: AgentService;
  public readonly execution: ExecutionService;
  public readonly market: MarketService;
  public readonly system: SystemService;

  constructor(config: Partial<ClientConfig> & { endpoint: string; apiKey: string }) {
    // Validate config
    const validation = ClientConfigSchema.safeParse({ ...DEFAULT_CONFIG, ...config });
    if (!validation.success) {
      throw new ValidationError(
        'Invalid client configuration',
        validation.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }))
      );
    }

    this.config = validation.data;

    // Initialize transport
    // TODO: Support gRPC transport
    this.transport = new RestTransport(this.config);

    // Initialize services
    this.intents = new IntentService(this.transport);
    this.agents = new AgentService(this.transport);
    this.execution = new ExecutionService(this.transport);
    this.market = new MarketService(this.transport);
    this.system = new SystemService(this.transport);
  }

  /**
   * Quick health check.
   */
  async health(): Promise<HealthResponse> {
    return this.system.health();
  }

  /**
   * Close the client and release resources.
   */
  async close(): Promise<void> {
    // TODO: Cleanup gRPC connections, cancel pending streams, etc.
  }
}
