import type {
  Intent,
  ActionType,
  Asset,
  AssetAmount,
  ConstraintSet,
  Urgency,
  OrderSide,
  PositionDirection,
} from '@nexwave/types';

/**
 * Fluent builder for creating intents.
 *
 * @example
 * ```ts
 * const intent = new IntentBuilder()
 *   .exchange()
 *   .from('USDC', '50000000000')
 *   .to('SOL')
 *   .maxSlippage(50)
 *   .deadline(60)
 *   .build();
 * ```
 */
export class IntentBuilder {
  private _action?: ActionType;
  private _inputs: AssetAmount[] = [];
  private _output?: Asset;
  private _constraints: Partial<ConstraintSet> = {};
  private _urgency: Urgency = 'NORMAL';
  private _deadlineSeconds?: number;
  private _metadata?: {
    label?: string;
    correlationId?: string;
    tags?: Record<string, string>;
  };

  // ─── Action Setters ─────────────────────────────────────────────────────────

  /** Set action to Exchange (market swap) */
  exchange(): this {
    this._action = { type: 'EXCHANGE' };
    return this;
  }

  /** Set action to Limit Order */
  limitOrder(side: 'buy' | 'sell', price: string): this {
    this._action = {
      type: 'LIMIT_ORDER',
      side: side.toUpperCase() as OrderSide,
      limitPrice: price,
    };
    return this;
  }

  /** Set action to Open Position */
  openPosition(direction: 'long' | 'short' | 'neutral' = 'long'): this {
    this._action = {
      type: 'OPEN_POSITION',
      leverage: { numerator: 1, denominator: 1 },
      direction: direction.toUpperCase() as PositionDirection,
    };
    return this;
  }

  /** Set action to Close Position */
  closePosition(positionId: string): this {
    this._action = { type: 'CLOSE_POSITION', positionId };
    return this;
  }

  /** Set action to Lend */
  lend(): this {
    this._action = { type: 'LEND' };
    return this;
  }

  /** Set action to Withdraw */
  withdraw(positionId: string): this {
    this._action = { type: 'WITHDRAW', positionId };
    return this;
  }

  // ─── Asset Setters ──────────────────────────────────────────────────────────

  /** Set input asset and amount */
  from(symbol: string, amount: string, decimals: number = 6): this {
    this._inputs = [
      {
        asset: { symbol, decimals },
        amount,
      },
    ];
    return this;
  }

  /** Set output asset */
  to(symbol: string, decimals: number = 9): this {
    this._output = { symbol, decimals };
    return this;
  }

  /** Add additional input (for multi-asset operations) */
  addInput(symbol: string, amount: string, decimals: number = 6): this {
    this._inputs.push({
      asset: { symbol, decimals },
      amount,
    });
    return this;
  }

  // ─── Constraint Setters ─────────────────────────────────────────────────────

  /** Set maximum slippage in basis points (100 = 1%) */
  maxSlippage(bps: number): this {
    this._constraints.maxSlippageBps = bps;
    return this;
  }

  /** Set maximum fee */
  maxFee(amount: string): this {
    this._constraints.maxFee = amount;
    return this;
  }

  /** Set minimum output amount */
  minOutput(amount: string): this {
    this._constraints.minOutput = amount;
    return this;
  }

  /** Set maximum notional value */
  maxNotional(amount: string): this {
    this._constraints.maxNotional = amount;
    return this;
  }

  /** Set retry policy */
  retries(max: number, backoffMs: number = 500): this {
    this._constraints.retryPolicy = {
      maxRetries: max,
      backoffMs,
      backoffMultiplier: 2,
    };
    return this;
  }

  /** Set stop loss price */
  stopLoss(price: string): this {
    this._constraints.stopLoss = price;
    return this;
  }

  /** Set take profit price */
  takeProfit(price: string): this {
    this._constraints.takeProfit = price;
    return this;
  }

  // ─── Position Modifiers ─────────────────────────────────────────────────────

  /** Set leverage for position (only applicable for OPEN_POSITION) */
  leverage(multiplier: number): this {
    if (this._action?.type === 'OPEN_POSITION') {
      this._action.leverage = { numerator: multiplier, denominator: 1 };
    }
    return this;
  }

  /** Set price range for concentrated liquidity (only applicable for OPEN_POSITION) */
  range(lower: string, upper: string): this {
    if (this._action?.type === 'OPEN_POSITION') {
      this._action.range = { lower, upper };
    }
    return this;
  }

  // ─── Urgency & Deadline ─────────────────────────────────────────────────────

  /** Set urgency level */
  urgency(level: 'low' | 'normal' | 'high'): this {
    this._urgency = level.toUpperCase() as Urgency;
    return this;
  }

  /** Set deadline (seconds from now) */
  deadline(seconds: number): this {
    this._deadlineSeconds = seconds;
    return this;
  }

  // ─── Metadata ───────────────────────────────────────────────────────────────

  /** Set label for this intent */
  label(label: string): this {
    this._metadata = { ...this._metadata, label };
    return this;
  }

  /** Set correlation ID for tracing */
  correlationId(id: string): this {
    this._metadata = { ...this._metadata, correlationId: id };
    return this;
  }

  /** Add a tag */
  tag(key: string, value: string): this {
    this._metadata = {
      ...this._metadata,
      tags: { ...this._metadata?.tags, [key]: value },
    };
    return this;
  }

  // ─── Build ──────────────────────────────────────────────────────────────────

  /** Build the intent */
  build(): Intent {
    if (!this._action) {
      throw new Error('Action is required. Call exchange(), limitOrder(), etc.');
    }
    if (this._inputs.length === 0) {
      throw new Error('At least one input is required. Call from().');
    }
    if (!this._output) {
      throw new Error('Output is required. Call to().');
    }
    if (!this._deadlineSeconds) {
      throw new Error('Deadline is required. Call deadline().');
    }

    return {
      action: this._action,
      inputs: this._inputs,
      output: this._output,
      constraints: {
        maxSlippageBps: this._constraints.maxSlippageBps ?? 100,
        maxFee: this._constraints.maxFee,
        maxNotional: this._constraints.maxNotional,
        minOutput: this._constraints.minOutput,
        retryPolicy: this._constraints.retryPolicy ?? {
          maxRetries: 3,
          backoffMs: 500,
          backoffMultiplier: 2,
        },
        priceLimit: this._constraints.priceLimit,
        stopLoss: this._constraints.stopLoss,
        takeProfit: this._constraints.takeProfit,
      },
      urgency: this._urgency,
      deadline: Date.now() + this._deadlineSeconds * 1000,
      metadata: this._metadata,
    };
  }
}
