import type { Context, Timer } from "@azure/functions";
import { MexcClient } from "@lib/mexcClient";
import { buildSignal } from "@lib/strategy";
import { buildRiskEnvelope, evaluateRisk } from "@lib/risk";
import {
  appendStrategyLog,
  closeTrade,
  getOpenTrade,
  getOrCreateUserSettings,
  getTodayLossPct,
  incrementDailyLoss,
  recordTrade,
} from "@lib/db";
import { decryptSecret, getSecret } from "@lib/keyVault";

const USER_ID = process.env.DEFAULT_USER_ID ?? "demo-user";
const ACCOUNT_BALANCE = Number(process.env.ACCOUNT_BALANCE ?? 1000);

async function loadCredentials(settings: Awaited<ReturnType<typeof getOrCreateUserSettings>>) {
  if (settings.apiKeyCipher && settings.apiSecretCipher) {
    const apiKey = await decryptSecret(settings.apiKeyCipher);
    const apiSecret = await decryptSecret(settings.apiSecretCipher);
    return { apiKey, apiSecret };
  }
  const apiKey = await getSecret(`mexc-api-key-${USER_ID}`);
  const apiSecret = await getSecret(`mexc-api-secret-${USER_ID}`);
  if (!apiKey || !apiSecret) {
    throw new Error("Missing MEXC credentials");
  }
  return { apiKey, apiSecret };
}

async function exitIfNeeded(
  context: Context,
  client: MexcClient,
  openTrade: Awaited<ReturnType<typeof getOpenTrade>>,
  price: number,
  signalConfidence: number,
) {
  if (!openTrade) return;
  const direction = openTrade.side === "BUY" ? 1 : -1;
  const stopTriggered =
    (direction === 1 && price <= Number(openTrade.stopLoss)) ||
    (direction === -1 && price >= Number(openTrade.stopLoss));
  const takeProfitTriggered =
    (direction === 1 && price >= Number(openTrade.takeProfit)) ||
    (direction === -1 && price <= Number(openTrade.takeProfit));
  const confidenceDrop = signalConfidence < 40;

  if (!(stopTriggered || takeProfitTriggered || confidenceDrop)) {
    return;
  }

  const closeSide = openTrade.side === "BUY" ? "SELL" : "BUY";
  await client.placeMarketOrder({
    side: closeSide,
    leverage: openTrade.leverage,
    quantity: Number(openTrade.quantity),
  });
  const pnl = (price - Number(openTrade.entryPrice)) * Number(openTrade.quantity) * direction;
  await closeTrade({ tradeId: openTrade.id, exitPrice: price, pnl });
  if (pnl < 0) {
    await incrementDailyLoss(openTrade.userSettingId, Math.abs(pnl) / ACCOUNT_BALANCE);
  }
  await appendStrategyLog({
    userSettingId: openTrade.userSettingId,
    level: "info",
    message: `Closed ${openTrade.side} via ${stopTriggered ? "stop" : takeProfitTriggered ? "target" : "confidence"}`,
    payload: { price, pnl },
  });
  context.log("Closed position", { tradeId: openTrade.id, pnl });
}

const timerTrigger = async (context: Context, timer: Timer): Promise<void> => {
  let userSettingId: string | null = null;
  try {
    if (!timer.isPastDue) {
      context.log("Timer trigger fired", timer.scheduleStatus?.next);
    }
    const settings = await getOrCreateUserSettings(USER_ID);
    userSettingId = settings.id;
    if (!settings.botEnabled) {
      context.log("Bot disabled, skipping");
      return;
    }

    const credentials = await loadCredentials(settings);
    const client = new MexcClient(credentials);

    const [candles, orderbook, price, openTrade, dailyLossPct] = await Promise.all([
      client.fetchRecentCandles(),
      client.fetchOrderBook(),
      client.fetchTicker(),
      getOpenTrade(settings.id),
      getTodayLossPct(settings.id),
    ]);

    const signal = buildSignal({ candles, orderbook });
    if (signal.action === "HOLD") {
      context.log("Signal HOLD, waiting");
      return;
    }
    await exitIfNeeded(context, client, openTrade, price, signal.confidence);
    if (openTrade) {
      return; // exit handled above, wait for next tick before considering new trade
    }

    const envelope = buildRiskEnvelope({
      accountBalance: ACCOUNT_BALANCE,
      riskPerTradePct: Number(settings.riskPerTradePct),
      leverage: settings.leverage,
      stopLossPct: Number(settings.stopLossPct),
      takeProfitPct: Number(settings.takeProfitPct),
      price,
      signal,
    });

    const riskCheck = evaluateRisk({
      envelope,
      openPositionCount: openTrade ? 1 : 0,
      dailyLossPct,
      signal,
    });

    if (riskCheck.blocked) {
      await appendStrategyLog({
        userSettingId: settings.id,
        level: "warn",
        message: "Trade blocked",
        payload: { reasons: riskCheck.reasons },
      });
      context.log("Risk blocked", riskCheck.reasons);
      return;
    }

    const side = signal.action;
    const quantity = Number(riskCheck.envelope.quantity.toFixed(3));
    const stopPrice =
      side === "BUY"
        ? price * (1 - riskCheck.envelope.stopLossPct)
        : price * (1 + riskCheck.envelope.stopLossPct);
    const takeProfitPrice =
      side === "BUY"
        ? price * (1 + riskCheck.envelope.takeProfitPct)
        : price * (1 - riskCheck.envelope.takeProfitPct);

    await client.placeMarketOrder({
      side,
      leverage: settings.leverage,
      quantity,
      stopLoss: stopPrice,
      takeProfit: takeProfitPrice,
    });

    await recordTrade({
      userSettingId: settings.id,
      userId: USER_ID,
      side,
      entryPrice: price,
      quantity,
      leverage: settings.leverage,
      confidence: signal.confidence,
      stopLoss: stopPrice,
      takeProfit: takeProfitPrice,
      reason: signal.reasons.join(" | "),
    });

    await appendStrategyLog({
      userSettingId: settings.id,
      level: "info",
      message: `Entered ${side} @ ${price.toFixed(3)}`,
      payload: {
        quantity,
        confidence: signal.confidence,
        metrics: signal.metrics,
      },
    });
    context.log("Executed order", { side, price, quantity });
  } catch (error) {
    context.log.error?.("runBot failure", error);
    if (userSettingId) {
      await appendStrategyLog({
        userSettingId,
        level: "error",
        message: "Bot execution failed",
        payload: { message: (error as Error).message },
      });
    }
  }
};

export = timerTrigger;
