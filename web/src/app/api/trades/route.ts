import { NextResponse } from "next/server";
import { listRecentTrades } from "@lib/db";

const USER_ID = process.env.DEFAULT_USER_ID ?? "demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const trades = await listRecentTrades(USER_ID, limit);
  return NextResponse.json({
    trades: trades.map((trade) => ({
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
  });
}
