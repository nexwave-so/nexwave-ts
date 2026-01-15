import { z } from 'zod';

export const TransportTypeSchema = z.enum(['grpc', 'rest']);
export type TransportType = z.infer<typeof TransportTypeSchema>;

export const ClientConfigSchema = z.object({
  /** Runtime endpoint (e.g., "localhost:50051" for gRPC, "http://localhost:8080" for REST) */
  endpoint: z.string(),
  /** API key for authentication */
  apiKey: z.string().startsWith('nxw_'),
  /** Transport type */
  transport: TransportTypeSchema.default('rest'),
  /** Request timeout in milliseconds */
  timeout: z.number().int().positive().default(30000),
  /** Number of retries for transient failures */
  retries: z.number().int().min(0).max(5).default(3),
  /** Enable debug logging */
  debug: z.boolean().default(false),
});
export type ClientConfig = z.infer<typeof ClientConfigSchema>;

export const DEFAULT_CONFIG: Partial<ClientConfig> = {
  transport: 'rest',
  timeout: 30000,
  retries: 3,
  debug: false,
};
