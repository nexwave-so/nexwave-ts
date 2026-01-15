import { NexwaveClient, type ClientConfig } from '@nexwave/sdk';
import { getCredentials } from './credentials';
import { AuthenticationError } from '@nexwave/sdk';

/**
 * Client factory - creates and manages NexwaveClient instances
 */
class ClientFactory {
  private client: NexwaveClient | null = null;
  private clientConfig: ClientConfig | null = null;

  /**
   * Get or create a client instance
   */
  async getClient(overrides?: { endpoint?: string; apiKey?: string }): Promise<NexwaveClient> {
    // If we have a client with the same config, reuse it
    if (this.client && this.clientConfig) {
      const creds = await getCredentials();
      const endpoint = overrides?.endpoint || creds?.endpoint;
      const apiKey = overrides?.apiKey || creds?.apiKey;

      if (
        endpoint === this.clientConfig.endpoint &&
        apiKey === this.clientConfig.apiKey
      ) {
        return this.client;
      }
    }

    // Get credentials
    const creds = await getCredentials();
    const endpoint = overrides?.endpoint || creds?.endpoint;
    const apiKey = overrides?.apiKey || creds?.apiKey;

    if (!endpoint || !apiKey) {
      throw new AuthenticationError(
        'No credentials found. Run "nexwave auth login" to authenticate.'
      );
    }

    // Create new client
    const config: ClientConfig = {
      endpoint,
      apiKey,
      timeout: 30000,
      transport: 'rest',
      retries: 3,
      debug: false,
    };

    this.client = new NexwaveClient(config);
    this.clientConfig = config;

    return this.client;
  }

  /**
   * Clear the cached client (useful after logout)
   */
  clear(): void {
    this.client = null;
    this.clientConfig = null;
  }
}

// Singleton instance
const factory = new ClientFactory();

/**
 * Get the Nexwave client instance
 */
export async function getClient(overrides?: { endpoint?: string; apiKey?: string }): Promise<NexwaveClient> {
  return factory.getClient(overrides);
}

/**
 * Clear the cached client
 */
export function clearClient(): void {
  factory.clear();
}
