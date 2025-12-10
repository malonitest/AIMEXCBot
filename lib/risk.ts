import { RiskEnvelope, StrategySignal } from "./types";

const DEFAULT_ACCOUNT_BALANCE = Number(process.env.ACCOUNT_BALANCE ?? 1000);

export type RiskCheck = {
  blocked: boolean;
  reasons: string[];
  envelope: RiskEnvelope;
};

export function buildRiskEnvelope(params: {
  accountBalance?: number;
  riskPerTradePct: number;
  leverage: number;
  stopLossPct: number;
  takeProfitPct: number;
  price: number;
  signal: StrategySignal;
}): RiskEnvelope {
  const accountBalance = params.accountBalance ?? DEFAULT_ACCOUNT_BALANCE;
  const riskPerTradePct = params.riskPerTradePct;
  const stopLossPct = Math.abs(params.stopLossPct || params.signal.suggestedStopLossPct);
  const takeProfitPct = Math.abs(params.takeProfitPct || params.signal.suggestedTakeProfitPct);
  const riskAmount = accountBalance * riskPerTradePct;
  const stopValue = Math.max(stopLossPct, 0.001);
  const quantity = (riskAmount / (stopValue * params.price)) * params.leverage;
  const positionNotional = quantity * params.price;

  return {
    accountBalance,
    riskPerTradePct,
    leverage: params.leverage,
    maxDailyLossPct: Number(process.env.MAX_DAILY_LOSS_PCT ?? 0.05),
    riskAmount,
    positionNotional,
    quantity,
    stopLossPct,
    takeProfitPct: takeProfitPct || 0.003,
  };
}

export function evaluateRisk(params: {
  envelope: RiskEnvelope;
  openPositionCount: number;
  dailyLossPct: number;
  signal: StrategySignal;
}): RiskCheck {
  const reasons: string[] = [];
  if (params.openPositionCount > 0) {
    reasons.push("An open position already exists");
  }
  if (params.dailyLossPct >= params.envelope.maxDailyLossPct) {
    reasons.push("Daily loss limit reached");
  }
  if (params.signal.confidence < 40 || params.signal.action === "HOLD") {
    reasons.push("Signal confidence below execution threshold");
  }
  const blocked = reasons.length > 0;
  return {
    blocked,
    reasons,
    envelope: params.envelope,
  };
}
