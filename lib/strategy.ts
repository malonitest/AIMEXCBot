import { Candle, OrderBookSnapshot, StrategySignal } from "./types";

const MOMENTUM_TARGET = { min: 0.2, max: 0.4 };
const VOLUME_TARGET = { min: 1.2, max: 1.5 };
const ORDERBOOK_THRESHOLD = 55;

function computeEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  const multiplier = 2 / (period + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i += 1) {
    ema = (values[i] - ema) * multiplier + ema;
  }
  return ema;
}

function slope(series: number[]): number {
  if (series.length < 2) return 0;
  const first = series[0];
  const last = series[series.length - 1];
  return ((last - first) / first) * 100;
}

function momentum(vo: number[]): number {
  if (vo.length < 2) return 0;
  const last = vo[vo.length - 1];
  const prev = vo[vo.length - 2];
  return ((last - prev) / prev) * 100;
}

export function buildSignal(params: {
  candles: Candle[];
  orderbook: OrderBookSnapshot;
}): StrategySignal {
  const closes = params.candles.map((c) => c.close);
  const volumes = params.candles.map((c) => c.volume);
  const ema20 = computeEMA(closes, 20);
  const ema50 = computeEMA(closes, 50);
  const ema100 = computeEMA(closes, 100);

  const ema20Slope = slope(closes.slice(-20));
  const ema50Slope = slope(closes.slice(-50));
  const ema100Slope = slope(closes.slice(-100));

  const avgVolume = volumes.reduce((acc, v) => acc + v, 0) / volumes.length;
  const lastMinuteVolume = volumes.slice(-6).reduce((acc, v) => acc + v, 0);
  const volumeDeltaPct = (lastMinuteVolume / ((avgVolume * 6) / volumes.length)) * 100;

  const highs = params.candles.map((c) => c.high);
  const lows = params.candles.map((c) => c.low);
  const volatilityDeltaPct = ((Math.max(...highs.slice(-6)) - Math.min(...lows.slice(-6))) / closes[closes.length - 1]) * 100;
  const priceMomentumPct = momentum(closes.slice(-3));

  const totalBook = params.orderbook.askNotional + params.orderbook.bidNotional;
  const orderbookImbalancePct = totalBook === 0 ? 50 : (params.orderbook.bidNotional / totalBook) * 100;

  const bullish = ema20 > ema50 && ema50 > ema100 && ema20Slope > 0;
  const bearish = ema20 < ema50 && ema50 < ema100 && ema20Slope < 0;

  const buyScore =
    (bullish ? 25 : 0) +
    (ema20Slope > 0.08 ? 15 : 0) +
    (volumeDeltaPct >= VOLUME_TARGET.min * 100 && volumeDeltaPct <= VOLUME_TARGET.max * 100 ? 15 : 0) +
    (priceMomentumPct >= MOMENTUM_TARGET.min && priceMomentumPct <= MOMENTUM_TARGET.max ? 20 : 0) +
    (orderbookImbalancePct > ORDERBOOK_THRESHOLD ? 15 : 0);

  const sellScore =
    (bearish ? 25 : 0) +
    (ema20Slope < -0.08 ? 15 : 0) +
    (volumeDeltaPct >= VOLUME_TARGET.min * 100 && volumeDeltaPct <= VOLUME_TARGET.max * 100 ? 15 : 0) +
    (priceMomentumPct <= -MOMENTUM_TARGET.min && priceMomentumPct >= -MOMENTUM_TARGET.max ? 20 : 0) +
    (orderbookImbalancePct < 100 - ORDERBOOK_THRESHOLD ? 15 : 0);

  let action: "BUY" | "SELL" | "HOLD" = "HOLD";
  let confidence = Math.max(buyScore, sellScore);
  const reasons: string[] = [];

  if (buyScore > sellScore && buyScore >= 45) {
    action = "BUY";
    reasons.push("Trend alignment across EMAs", `OB buy pressure ${orderbookImbalancePct.toFixed(1)}%`);
  } else if (sellScore > buyScore && sellScore >= 45) {
    action = "SELL";
    reasons.push("Bearish EMA stack", `OB sell pressure ${(100 - orderbookImbalancePct).toFixed(1)}%`);
  } else {
    confidence = Math.min(confidence, 30);
    reasons.push("Conditions not aligned");
  }

  return {
    action,
    confidence: Math.min(Math.round(confidence), 100),
    reasons,
    metrics: {
      ema20,
      ema50,
      ema100,
      ema20Slope,
      volumeDeltaPct,
      volatilityDeltaPct,
      orderbookImbalancePct,
      priceMomentumPct,
    },
    suggestedStopLossPct: action === "BUY" ? 0.0015 : 0.001,
    suggestedTakeProfitPct: action === "BUY" ? 0.0035 : 0.0025,
  };
}
