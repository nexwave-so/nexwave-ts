import type {
  AgentConfig,
  AgentSchedule,
  AgentLimits,
  AgentTrigger,
  Intent,
} from '@nexwave/types';
import { IntentBuilder } from './intent';

/**
 * Fluent builder for creating agent configurations.
 *
 * @example
 * ```ts
 * const config = new AgentConfigBuilder()
 *   .withIntent(intent)
 *   .everyHour()
 *   .maxExecutionsPerDay(24)
 *   .circuitBreaker(3)
 *   .build();
 * ```
 */
export class AgentConfigBuilder {
  private _intentTemplate?: Intent;
  private _schedule: AgentSchedule = {};
  private _limits: AgentLimits = {};
  private _triggers: AgentTrigger[] = [];
  private _adapters: string[] = [];

  // ─── Intent Template ────────────────────────────────────────────────────────

  /** Set intent template directly */
  withIntent(intent: Intent): this {
    this._intentTemplate = intent;
    return this;
  }

  /** Build intent template using builder */
  withIntentBuilder(builder: IntentBuilder): this {
    this._intentTemplate = builder.build();
    return this;
  }

  // ─── Schedule ───────────────────────────────────────────────────────────────

  /** Run once immediately */
  once(): this {
    this._schedule = { once: true };
    return this;
  }

  /** Run on interval (milliseconds) */
  every(ms: number): this {
    this._schedule = { intervalMs: ms };
    return this;
  }

  /** Run every minute */
  everyMinute(): this {
    return this.every(60 * 1000);
  }

  /** Run every hour */
  everyHour(): this {
    return this.every(60 * 60 * 1000);
  }

  /** Run every N hours */
  everyNHours(hours: number): this {
    return this.every(hours * 60 * 60 * 1000);
  }

  /** Run on cron schedule */
  cron(expression: string): this {
    this._schedule = { cron: expression };
    return this;
  }

  /** Run only when triggered */
  triggerOnly(): this {
    this._schedule = { triggerOnly: true };
    return this;
  }

  // ─── Limits ─────────────────────────────────────────────────────────────────

  /** Set maximum executions per day */
  maxExecutionsPerDay(count: number): this {
    this._limits.maxExecutionsPerDay = count;
    return this;
  }

  /** Set maximum daily notional */
  maxDailyNotional(amount: string): this {
    this._limits.maxDailyNotional = amount;
    return this;
  }

  /** Set maximum single execution notional */
  maxSingleNotional(amount: string): this {
    this._limits.maxSingleNotional = amount;
    return this;
  }

  /** Set maximum concurrent executions */
  maxConcurrent(count: number): this {
    this._limits.maxConcurrent = count;
    return this;
  }

  /** Set circuit breaker threshold */
  circuitBreaker(threshold: number): this {
    this._limits.circuitBreakerThreshold = threshold;
    return this;
  }

  // ─── Triggers ───────────────────────────────────────────────────────────────

  /** Add a price trigger */
  onPriceAbove(
    asset: string,
    price: string,
    decimals: number = 9
  ): this {
    this._triggers.push({
      type: 'price',
      asset: { symbol: asset, decimals },
      threshold: price,
      condition: 'ABOVE',
    });
    return this;
  }

  /** Add a price trigger */
  onPriceBelow(
    asset: string,
    price: string,
    decimals: number = 9
  ): this {
    this._triggers.push({
      type: 'price',
      asset: { symbol: asset, decimals },
      threshold: price,
      condition: 'BELOW',
    });
    return this;
  }

  /** Add a price trigger for crossing above */
  onPriceCrossesAbove(
    asset: string,
    price: string,
    decimals: number = 9
  ): this {
    this._triggers.push({
      type: 'price',
      asset: { symbol: asset, decimals },
      threshold: price,
      condition: 'CROSSES_ABOVE',
    });
    return this;
  }

  /** Add a price trigger for crossing below */
  onPriceCrossesBelow(
    asset: string,
    price: string,
    decimals: number = 9
  ): this {
    this._triggers.push({
      type: 'price',
      asset: { symbol: asset, decimals },
      threshold: price,
      condition: 'CROSSES_BELOW',
    });
    return this;
  }

  /** Add a time trigger */
  onTime(timestamp: number): this {
    this._triggers.push({
      type: 'time',
      at: timestamp,
    });
    return this;
  }

  /** Add an event trigger */
  onEvent(eventType: string, filters?: Record<string, string>): this {
    this._triggers.push({
      type: 'event',
      eventType,
      filters,
    });
    return this;
  }

  // ─── Adapters ───────────────────────────────────────────────────────────────

  /** Use specific adapters */
  useAdapters(...adapters: string[]): this {
    this._adapters = adapters;
    return this;
  }

  // ─── Build ──────────────────────────────────────────────────────────────────

  /** Build the agent configuration */
  build(): AgentConfig {
    if (!this._intentTemplate) {
      throw new Error('Intent template is required. Call withIntent() or withIntentBuilder().');
    }

    return {
      intentTemplate: this._intentTemplate,
      schedule: Object.keys(this._schedule).length > 0 ? this._schedule : undefined,
      limits: Object.keys(this._limits).length > 0 ? this._limits : undefined,
      triggers: this._triggers.length > 0 ? this._triggers : undefined,
      adapters: this._adapters.length > 0 ? this._adapters : undefined,
    };
  }
}
