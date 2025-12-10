"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { jsonFetcher } from "@/lib/fetcher";
import type { SettingsPayload } from "@/types/api";

const schema = z.object({
  botEnabled: z.boolean().default(true),
  leverage: z.number().min(1).max(50),
  riskPerTradePct: z.number().min(0.005).max(0.03),
  stopLossPct: z.number().min(0.001).max(0.005),
  takeProfitPct: z.number().min(0.002).max(0.02),
  maxDailyLossPct: z.number().min(0.02).max(0.2),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  notes: z.string().max(280).optional(),
});

type FormShape = z.infer<typeof schema>;

export function SettingsForm() {
  const { data, isLoading, mutate } = useSWR<SettingsPayload & { updatedAt?: string }>("/api/settings", jsonFetcher);
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting, errors },
  } = useForm<FormShape>({
    resolver: zodResolver(schema),
    defaultValues: {
      botEnabled: true,
      leverage: 50,
      riskPerTradePct: 0.015,
      stopLossPct: 0.0015,
      takeProfitPct: 0.0035,
      maxDailyLossPct: 0.05,
    },
  });

  const botEnabledValue = useWatch({ control, name: "botEnabled" });

  useEffect(() => {
    if (data) {
      reset({
        botEnabled: data.botEnabled,
        leverage: data.leverage,
        riskPerTradePct: data.riskPerTradePct,
        stopLossPct: data.stopLossPct,
        takeProfitPct: data.takeProfitPct,
        maxDailyLossPct: data.maxDailyLossPct,
      });
    }
  }, [data, reset]);

  const onSubmit = handleSubmit(async (formValues) => {
    setStatus(null);
    const payload: SettingsPayload = {
      ...formValues,
    };
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const message = await res.text();
      setStatus(message || "Save failed");
      return;
    }
    mutate();
    setStatus("Saved ✔");
  });

  return (
    <form onSubmit={onSubmit} className="glass-card space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk & Execution</p>
        <h2 className="mt-1 text-3xl font-semibold text-white">Account Controls</h2>
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          Bot Mode
          <div className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2">
            <input
              type="checkbox"
              {...register("botEnabled", { setValueAs: (val) => Boolean(val) })}
              className="h-5 w-5 accent-emerald-400"
            />
            <span>{botEnabledValue ? "Enabled" : "Paused"}</span>
          </div>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Leverage
          <input type="number" step="1" min={1} max={50} {...register("leverage", { valueAsNumber: true })} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" />
          {errors.leverage ? <span className="text-xs text-rose-300">{errors.leverage.message}</span> : null}
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Risk %
          <input type="number" step="0.001" {...register("riskPerTradePct", { valueAsNumber: true })} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Stop Loss %
          <input type="number" step="0.0001" {...register("stopLossPct", { valueAsNumber: true })} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Take Profit %
          <input type="number" step="0.0001" {...register("takeProfitPct", { valueAsNumber: true })} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Max Daily Loss %
          <input type="number" step="0.01" {...register("maxDailyLossPct", { valueAsNumber: true })} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" />
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          MEXC API Key
          <input type="password" {...register("apiKey")} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" placeholder="Only needed when rotating" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          MEXC API Secret
          <input type="password" {...register("apiSecret")} className="rounded-xl border border-white/10 bg-transparent px-3 py-2" placeholder="Encrypted via Key Vault" />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        Notes
        <textarea {...register("notes")} rows={3} className="rounded-2xl border border-white/10 bg-transparent px-3 py-2" placeholder="Document adjustments, IP allowlist, etc." />
      </label>

      <button disabled={isSubmitting} className="w-full rounded-full bg-emerald-400/90 py-3 font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed" type="submit">
        {isSubmitting ? "Saving..." : "Save Settings"}
      </button>
      {status ? <p className="text-center text-sm text-emerald-300">{status}</p> : null}
      {isLoading ? <p className="text-center text-sm text-slate-400">Loading current settings…</p> : null}
    </form>
  );
}
