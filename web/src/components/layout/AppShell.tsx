import type { ReactNode } from "react";
import { AppNav } from "./AppNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[200px]" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-cyan-500/20 blur-[180px]" />
        </div>
        <AppNav />
        <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
