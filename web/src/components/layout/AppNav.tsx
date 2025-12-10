"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart, Settings2, ScrollText } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/trades", label: "Trade Log", icon: ScrollText },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AIMEXC Bot</p>
          <h1 className="font-display text-2xl font-semibold text-white">SOL/USDT · 50× Trend AI</h1>
        </div>
        <nav className="hidden gap-4 sm:flex">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:border-white/60 ${
                  active ? "border-emerald-400 text-emerald-300" : "border-white/10 text-slate-300"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
