"use client";

import useSWR from "swr";
import Link from "next/link";
import { ShieldCheck, ActivitySquare } from "lucide-react";
import { jsonFetcher } from "@/lib/fetcher";
import type { StatusResponse } from "@/types/api";

const REFRESH_MS = Number(process.env.NEXT_PUBLIC_DASHBOARD_REFRESH_MS ?? 10000);

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass-card flex flex-col gap-2">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="font-display text-3xl font-semibold text-white">{value}</p>
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function TradeRow({ trade }: { trade: StatusResponse["recentTrades"][number] }) {
  return (
    <div className="grid grid-cols-6 items-center rounded-xl border border-white/5 px-4 py-3 text-sm text-slate-300">
      <span className={trade.side === "BUY" ? "text-emerald-300" : "text-rose-300"}>{trade.side}</span>
      <span>{trade.entryPrice.toFixed(2)}</span>
      <span>{trade.exitPrice ? trade.exitPrice.toFixed(2) : "--"}</span>
      <span>{trade.pnl ? `${trade.pnl.toFixed(2)} USDT` : "--"}</span>
      <span>{trade.confidence}%</span>
      <span className="text-right">{new Date(trade.openedAt).toLocaleTimeString()}</span>
    </div>
  );
}

export function DashboardScreen() {
  const { data, error, isLoading } = useSWR<StatusResponse>("/api/status", jsonFetcher, {
    refreshInterval: REFRESH_MS,
  });

  const signal = data?.signal;
  const openPosition = data?.openPosition;

  return (
    <section className="grid gap-8">
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live Signal</p>
              <h2 className="font-display text-4xl font-semibold text-white">
                {isLoading ? "--" : signal?.action ?? "HOLD"}
              </h2>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-sm text-slate-400">Confidence</span>
              <span className="text-4xl font-bold text-emerald-300">{signal?.confidence ?? 0}%</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Price</p>
              <p className="text-lg font-semibold text-white">{data?.price?.toFixed(3) ?? "--"} USDT</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Momentum</p>
              <p>{signal ? `${signal.metrics.priceMomentumPct.toFixed(2)}%` : "--"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Orderbook Bias</p>
              <p>{signal ? `${signal.metrics.orderbookImbalancePct.toFixed(1)}%` : "--"}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="EMA Stack" value={`${signal?.metrics.ema20.toFixed(2) ?? "--"}`} hint="20 / 50 / 100" />
            <StatCard label="Volume Delta" value={signal ? `${signal.metrics.volumeDeltaPct.toFixed(1)}%` : "--"} />
            <StatCard label="Volatility" value={signal ? `${signal.metrics.volatilityDeltaPct.toFixed(2)}%` : "--"} />
          </div>
        </div>
        <div className="glass-card flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk Envelope</p>
              <h3 className="text-xl font-semibold">1.5% Risk / Trade</h3>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <p>
              Position Size: <span className="text-white">{data?.risk ? `${data.risk.quantity.toFixed(3)} SOL` : "--"}</span>
            </p>
            <p>
              Stop Loss: <span className="text-rose-300">-{((data?.risk?.stopLossPct ?? 0) * 100).toFixed(2)}%</span>
            </p>
            <p>
              Take Profit: <span className="text-emerald-300">{((data?.risk?.takeProfitPct ?? 0) * 100).toFixed(2)}%</span>
            </p>
            <p>
              Daily Loss: {((data?.risk?.dailyLossPct ?? 0) * 100).toFixed(2)}% / {((data?.risk?.maxDailyLossPct ?? 0) * 100).toFixed(1)}%
            </p>
          </div>
          <Link className="mt-auto text-sm text-emerald-300 underline" href="/settings">
            Adjust risk controls →
          </Link>
        </div>
      </div>

      <div className="glass-card grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Open Position</p>
            <h3 className="text-2xl font-semibold text-white">{openPosition ? `${openPosition.side}` : "No active trade"}</h3>
          </div>
          {openPosition ? (
            <div className="text-right">
              <p className="text-sm text-slate-400">PnL</p>
              <p className={`text-3xl font-semibold ${openPosition.unrealizedPnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {openPosition.unrealizedPnl.toFixed(2)} USDT
              </p>
            </div>
          ) : null}
        </div>
        {openPosition ? (
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Entry" value={`${openPosition.entryPrice.toFixed(3)} USDT`} />
            <StatCard label="Size" value={`${openPosition.quantity.toFixed(2)} SOL`} />
            <StatCard label="Stop" value={`${openPosition.stopLoss.toFixed(3)} USDT`} />
            <StatCard label="Take Profit" value={`${openPosition.takeProfit.toFixed(3)} USDT`} />
          </div>
        ) : (
          <p className="text-sm text-slate-400">Bot is flat until the next qualified signal.</p>
        )}
      </div>

      <div className="glass-card grid gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <ActivitySquare size={18} />
            <span>Latest Executions</span>
          </div>
          <Link href="/trades" className="text-sm text-emerald-300">
            View full log
          </Link>
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-6 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span>Side</span>
            <span>Entry</span>
            <span>Exit</span>
            <span>PnL</span>
            <span>Conf</span>
            <span className="text-right">Opened</span>
          </div>
          {error ? <p className="text-rose-300">{error.message}</p> : null}
          {data?.recentTrades?.length ? (
            data.recentTrades.slice(0, 6).map((trade) => <TradeRow key={trade.id} trade={trade} />)
          ) : (
            <p className="text-sm text-slate-400">No trades yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
