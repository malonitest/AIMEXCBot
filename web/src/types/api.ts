import type { StrategySignal } from "@lib/types";

export type StatusResponse = {
  timestamp: string;
  price: number;
  signal: StrategySignal;
  openPosition?: {
    side: "LONG" | "SHORT";
    entryPrice: number;
    quantity: number;
    stopLoss: number;
    takeProfit: number;
    unrealizedPnl: number;
  } | null;
  recentTrades: Array<{
    id: string;
    side: "BUY" | "SELL";
    entryPrice: number;
    exitPrice?: number;
    pnl?: number;
    status: string;
    confidence: number;
    openedAt: string;
    closedAt?: string;
  }>;
  risk: {
    riskPerTradePct: number;
    leverage: number;
    dailyLossPct: number;
    maxDailyLossPct: number;
    quantity: number;
    stopLossPct: number;
    takeProfitPct: number;
  };
  settings: {
    botEnabled: boolean;
    leverage: number;
  };
};

export type SettingsPayload = {
  botEnabled: boolean;
  leverage: number;
  riskPerTradePct: number;
  stopLossPct: number;
  takeProfitPct: number;
  maxDailyLossPct: number;
  apiKey?: string;
  apiSecret?: string;
  notes?: string;
};

export type TradeEntry = {
  id: string;
  side: "BUY" | "SELL";
  status: string;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  confidence: number;
  leverage: number;
  quantity: number;
  openedAt: string;
  closedAt?: string;
  reason: string;
};

export type TradesResponse = {
  trades: TradeEntry[];
};
