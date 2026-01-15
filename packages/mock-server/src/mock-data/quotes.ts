import type { Intent } from '@nexwave/types';

// Mock price data (USDC per token)
const MOCK_PRICES: Record<string, number> = {
  SOL: 95.0,
  ETH: 3200.0,
  BTC: 42000.0,
  USDC: 1.0,
  USDT: 1.0,
};

export function generateMockQuote(intent: Intent) {
  const inputAsset = intent.inputs[0]?.asset.symbol ?? 'USDC';
  const outputAsset = intent.output.symbol;
  const inputAmount = BigInt(intent.inputs[0]?.amount ?? '0');
  const inputDecimals = intent.inputs[0]?.asset.decimals ?? 6;
  const outputDecimals = intent.output.decimals ?? 9;

  // Calculate prices
  const inputPrice = MOCK_PRICES[inputAsset] ?? 1;
  const outputPrice = MOCK_PRICES[outputAsset] ?? 100;
  const rate = inputPrice / outputPrice;

  // Calculate output amount
  const inputNormalized = Number(inputAmount) / Math.pow(10, inputDecimals);
  const outputNormalized = inputNormalized * rate;

  // Add some randomness for realism
  const slippageMultiplier = 0.997 + Math.random() * 0.004; // 0.3% - 0.7% slippage
  const outputWithSlippage = outputNormalized * slippageMultiplier;

  const outputAmount = BigInt(
    Math.floor(outputWithSlippage * Math.pow(10, outputDecimals))
  ).toString();

  const maxSlippageBps = intent.constraints?.maxSlippageBps ?? 100;
  const minOutput = BigInt(
    Math.floor(
      outputNormalized * (1 - maxSlippageBps / 10000) * Math.pow(10, outputDecimals)
    )
  ).toString();

  // Price as scaled integer (multiply by 1e9)
  const priceScaled = BigInt(Math.floor(rate * 1e9)).toString();

  return {
    outputAmount,
    minOutput,
    price: priceScaled,
    validUntil: Date.now() + 30000,
    route: [
      {
        venue: 'mock-venue',
        pool: `${inputAsset}-${outputAsset}`,
        inputAsset,
        outputAsset,
        portion: 1.0,
      },
    ],
    cost: {
      networkFee: '5000', // 0.000005 SOL
      protocolFee: '25000', // 0.25% mock
      priorityFee: '10000',
      priceImpactBps: Math.floor(Math.random() * 30) + 5, // 5-35 bps
    },
  };
}

export function getMockMarketState(base: string, quote: string) {
  const basePrice = MOCK_PRICES[base] ?? 100;
  const quotePrice = MOCK_PRICES[quote] ?? 1;
  const midPrice = (basePrice / quotePrice) * 1e9;

  // Add some spread
  const spread = midPrice * 0.001; // 0.1% spread

  return {
    base: { symbol: base, decimals: 9 },
    quote: { symbol: quote, decimals: 6 },
    bestBid: BigInt(Math.floor(midPrice - spread)).toString(),
    bestAsk: BigInt(Math.floor(midPrice + spread)).toString(),
    midPrice: BigInt(Math.floor(midPrice)).toString(),
    liquidityDepth: '10000000000000', // $10M mock liquidity
    lastTradePrice: BigInt(
      Math.floor(midPrice * (0.999 + Math.random() * 0.002))
    ).toString(),
    volume24h: '50000000000000', // $50M mock volume
    priceChange24h: (Math.random() - 0.5) * 10, // -5% to +5%
  };
}
