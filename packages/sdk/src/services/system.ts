import type { HealthResponse, RuntimeInfo, Adapter } from '@nexwave/types';
import type { RestTransport } from '../transport/rest';

// ─── Response Types ─────────────────────────────────────────────────────────

export interface RuntimeConfig {
  adapters: string[];
  defaultTimeout: number;
  maxRetries: number;
}

// ─── System Service ─────────────────────────────────────────────────────────

export class SystemService {
  constructor(private transport: RestTransport) {}

  /**
   * Health check.
   */
  async health(detailed: boolean = false): Promise<HealthResponse> {
    const params = new URLSearchParams();
    if (detailed) params.set('detailed', 'true');

    const query = params.toString();
    return this.transport.request<HealthResponse>({
      method: 'GET',
      path: `/health${query ? `?${query}` : ''}`,
    });
  }

  /**
   * Get runtime version and info.
   */
  async getInfo(): Promise<RuntimeInfo> {
    return this.transport.request<RuntimeInfo>({
      method: 'GET',
      path: '/info',
    });
  }

  /**
   * Get current configuration.
   */
  async getConfig(): Promise<RuntimeConfig> {
    return this.transport.request<RuntimeConfig>({
      method: 'GET',
      path: '/config',
    });
  }

  /**
   * Update configuration.
   */
  async updateConfig(config: Partial<RuntimeConfig>): Promise<RuntimeConfig> {
    return this.transport.request<RuntimeConfig>({
      method: 'PATCH',
      path: '/config',
      body: config,
    });
  }

  /**
   * List connected adapters.
   */
  async listAdapters(): Promise<Adapter[]> {
    const response = await this.transport.request<{ adapters: Adapter[] }>({
      method: 'GET',
      path: '/adapters',
    });
    return response.adapters;
  }
}
