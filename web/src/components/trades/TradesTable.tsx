"use client";

import useSWR from "swr";
import { jsonFetcher } from "@/lib/fetcher";
import type { TradesResponse } from "@/types/api";

export function TradesTable() {
  const { data, error, isLoading } = useSWR<TradesResponse>("/api/trades", jsonFetcher, {
    refreshInterval: 30000,
  });

  return (
    <div className="glass-card space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Executed trades</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Strategy ledger</h2>
      </div>
      {error ? <p className="text-rose-300">{error.message}</p> : null}
      {isLoading ? <p className="text-slate-500">Loading trades…</p> : null}
      <div className="grid grid-cols-8 text-xs uppercase tracking-[0.2em] text-slate-500">
        <span>Side</span>
        <span>Status</span>
        <span>Entry</span>
        <span>Exit</span>
        <span>PnL</span>
        <span>Conf</span>
        <span>Size</span>
        <span className="text-right">Opened</span>
      </div>
      <div className="space-y-3">
        {data?.trades?.length ? (
          data.trades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-8 items-center rounded-2xl border border-white/5 px-4 py-3 text-sm text-slate-200">
              <span className={trade.side === "BUY" ? "text-emerald-300" : "text-rose-300"}>{trade.side}</span>
              <span>{trade.status}</span>
              <span>{trade.entryPrice.toFixed(3)}</span>
              <span>{trade.exitPrice ? trade.exitPrice.toFixed(3) : "--"}</span>
              <span className={trade.pnl && trade.pnl > 0 ? "text-emerald-300" : trade.pnl ? "text-rose-300" : "text-slate-400"}>
                {trade.pnl ? trade.pnl.toFixed(2) : "--"}
              </span>
              <span>{trade.confidence}%</span>
              <span>{trade.quantity.toFixed(2)} SOL</span>
              <span className="text-right">{new Date(trade.openedAt).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p className="text-slate-400">No trades logged yet.</p>
        )}
      </div>
    </div>
  );
}
