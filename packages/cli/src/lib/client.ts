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
    let endpoint = overrides?.endpoint || creds?.endpoint;
    let apiKey = overrides?.apiKey || creds?.apiKey;

    // Default to local mock server for development/testing
    // Only use defaults if:
    // 1. No credentials are set (no env vars, no stored creds)
    // 2. AND we're in development mode OR connecting to localhost
    if (!endpoint || !apiKey) {
      const isDevelopment = 
        process.env.NODE_ENV === 'development' || 
        process.env.NEXWAVE_DEV === 'true' ||
        (!process.env.NEXWAVE_ENDPOINT && !creds); // No explicit endpoint and no stored creds
      
      if (isDevelopment) {
        endpoint = endpoint || 'http://localhost:8080';
        apiKey = apiKey || 'nxw_test_example';
        // Only show warning once per session
        if (!process.env.NEXWAVE_SUPPRESS_DEV_WARNING) {
          console.warn('⚠ Using default development credentials');
          console.warn('  Endpoint: http://localhost:8080');
          console.warn('  API Key: nxw_test_example');
          console.warn('  Set NEXWAVE_ENDPOINT and NEXWAVE_API_KEY or run "nexwave auth login" for production');
          console.warn('');
        }
      } else {
        throw new AuthenticationError(
          'No credentials found. Run "nexwave auth login" to authenticate.'
        );
      }
    }

    // Create new client
    const config: ClientConfig = {
      endpoint: endpoint!,
      apiKey: apiKey!,
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
