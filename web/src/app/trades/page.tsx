import { TradesTable } from "@/components/trades/TradesTable";

export default function TradesPage() {
  return (
    <section className="space-y-6">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Execution history</p>
      <h1 className="font-display text-4xl font-semibold text-white">Trades & telemetry</h1>
      <TradesTable />
    </section>
  );
}
