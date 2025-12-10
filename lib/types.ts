export type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type OrderBookSnapshot = {
  bidNotional: number;
  askNotional: number;
};

export type StrategyAction = "BUY" | "SELL" | "HOLD";

export type StrategySignal = {
  action: StrategyAction;
  confidence: number;
  reasons: string[];
  metrics: {
    ema20: number;
    ema50: number;
    ema100: number;
    ema20Slope: number;
    volumeDeltaPct: number;
    volatilityDeltaPct: number;
    orderbookImbalancePct: number;
    priceMomentumPct: number;
  };
  suggestedStopLossPct: number;
  suggestedTakeProfitPct: number;
};

export type RiskEnvelope = {
  accountBalance: number;
  riskPerTradePct: number;
  leverage: number;
  maxDailyLossPct: number;
  riskAmount: number;
  positionNotional: number;
  quantity: number;
  stopLossPct: number;
  takeProfitPct: number;
};

export type BotStatus = {
  price: number;
  openPosition?: {
    side: "LONG" | "SHORT";
    entryPrice: number;
    quantity: number;
    stopLoss: number;
    takeProfit: number;
    unrealizedPnl: number;
  };
  dailyLossPct: number;
  signal: StrategySignal;
};
