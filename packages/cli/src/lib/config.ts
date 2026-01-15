import Conf from 'conf';
import { z } from 'zod';
import path from 'path';
import os from 'os';

/**
 * CLI configuration schema
 */
export const CliConfigSchema = z.object({
  default: z.object({
    network: z.enum(['mainnet', 'devnet']).default('mainnet'),
    urgency: z.enum(['low', 'normal', 'high']).default('normal'),
    maxSlippageBps: z.number().int().min(0).max(10000).default(50),
    maxRetries: z.number().int().min(0).max(10).default(3),
  }),
  output: z.object({
    format: z.enum(['table', 'json', 'yaml']).default('table'),
    color: z.boolean().default(true),
    verbose: z.boolean().default(false),
  }),
  telemetry: z.object({
    enabled: z.boolean().default(true),
  }),
});

export type CliConfig = z.infer<typeof CliConfigSchema>;

const defaultConfig: CliConfig = {
  default: {
    network: 'mainnet',
    urgency: 'normal',
    maxSlippageBps: 50,
    maxRetries: 3,
  },
  output: {
    format: 'table',
    color: true,
    verbose: false,
  },
  telemetry: {
    enabled: true,
  },
};

/**
 * Configuration manager for CLI settings
 */
export class ConfigManager {
  private conf: Conf<CliConfig>;

  constructor(configPath?: string) {
    this.conf = new Conf<CliConfig>({
      configName: 'nexwave',
      cwd: configPath || path.join(os.homedir(), '.nexwave'),
      defaults: defaultConfig,
      // Don't use schema validation with Conf - we'll validate manually if needed
    });
  }

  /**
   * Get a config value by dot-notation path (e.g., "default.network")
   */
  get<T = unknown>(key: string): T | undefined {
    const keys = key.split('.');
    let value: any = this.conf.store;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value as T;
  }

  /**
   * Set a config value by dot-notation path
   */
  set(key: string, value: unknown): void {
    const keys = key.split('.');
    
    if (keys.length === 1) {
      // Top-level key
      this.conf.set(key as keyof CliConfig, value as any);
      return;
    }
    
    // Nested key - need to update the parent object
    const rootKey = keys[0] as keyof CliConfig;
    const nestedKeys = keys.slice(1);
    
    // Get current value or create new object
    const current = this.conf.get(rootKey) || {};
    if (typeof current !== 'object' || current === null) {
      throw new Error(`Cannot set nested value: ${rootKey} is not an object`);
    }
    
    // Navigate/create nested structure
    let target: any = current;
    for (let i = 0; i < nestedKeys.length - 1; i++) {
      const k = nestedKeys[i];
      if (!target[k] || typeof target[k] !== 'object' || target[k] === null) {
        target[k] = {};
      }
      target = target[k];
    }
    
    // Set the final value
    target[nestedKeys[nestedKeys.length - 1]] = value;
    
    // Save the updated root object
    this.conf.set(rootKey, current as any);
  }

  /**
   * Get all config
   */
  getAll(): CliConfig {
    return this.conf.store;
  }

  /**
   * Reset config to defaults
   */
  reset(): void {
    this.conf.clear();
    Object.assign(this.conf.store, defaultConfig);
  }

  /**
   * Get config file path
   */
  getPath(): string {
    return this.conf.path;
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

/**
 * Get the global config manager instance
 */
export function getConfigManager(configPath?: string): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager(configPath);
  }
  return configManager;
}
