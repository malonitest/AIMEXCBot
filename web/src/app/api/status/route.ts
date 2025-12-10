import { NextResponse } from "next/server";
import { buildSignal } from "@lib/strategy";
import { buildRiskEnvelope } from "@lib/risk";
import { publicClient } from "@lib/mexcClient";
import { getOpenTrade, getOrCreateUserSettings, getTodayLossPct, listRecentTrades } from "@lib/db";

const USER_ID = process.env.DEFAULT_USER_ID ?? "demo-user";

export async function GET() {
  try {
    const settings = await getOrCreateUserSettings(USER_ID);
    const [candles, orderbook, price, openTrade, trades, dailyLossPct] = await Promise.all([
      publicClient.fetchRecentCandles(),
      publicClient.fetchOrderBook(),
      publicClient.fetchTicker(),
      getOpenTrade(settings.id),
      listRecentTrades(USER_ID, 12),
      getTodayLossPct(settings.id),
    ]);

    const signal = buildSignal({ candles, orderbook });
    const envelope = buildRiskEnvelope({
      accountBalance: Number(process.env.ACCOUNT_BALANCE ?? 1000),
      riskPerTradePct: Number(settings.riskPerTradePct),
      leverage: settings.leverage,
      stopLossPct: Number(settings.stopLossPct),
      takeProfitPct: Number(settings.takeProfitPct),
      price,
      signal,
    });

    const openPosition = openTrade
      ? {
          side: openTrade.side === "BUY" ? "LONG" : "SHORT",
          entryPrice: Number(openTrade.entryPrice),
          quantity: Number(openTrade.quantity),
          stopLoss: Number(openTrade.stopLoss),
          takeProfit: Number(openTrade.takeProfit),
          unrealizedPnl:
            (price - Number(openTrade.entryPrice)) * Number(openTrade.quantity) * (openTrade.side === "BUY" ? 1 : -1),
        }
      : null;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      price,
      signal,
      openPosition,
      recentTrades: trades.map((trade) => ({
        id: trade.id,
        side: trade.side,
        status: trade.status,
        entryPrice: Number(trade.entryPrice),
        exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
        pnl: trade.pnl ? Number(trade.pnl) : undefined,
        confidence: trade.confidence,
        leverage: trade.leverage,
        quantity: Number(trade.quantity),
        openedAt: trade.openedAt.toISOString(),
        closedAt: trade.closedAt ? trade.closedAt.toISOString() : undefined,
        reason: trade.reason,
      })),
      risk: {
        riskPerTradePct: Number(settings.riskPerTradePct),
        leverage: settings.leverage,
        dailyLossPct,
        maxDailyLossPct: Number(settings.maxDailyLossPct),
        quantity: envelope.quantity,
        stopLossPct: envelope.stopLossPct,
        takeProfitPct: envelope.takeProfitPct,
      },
      settings: {
        botEnabled: settings.botEnabled,
        leverage: settings.leverage,
      },
    });
  } catch (error) {
    console.error("/api/status", error);
    return NextResponse.json({ error: "Unable to load status" }, { status: 500 });
  }
}
