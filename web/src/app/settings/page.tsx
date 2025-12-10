import { SettingsForm } from "@/components/settings/SettingsForm";

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Secrets, limits, automation</p>
      <h1 className="font-display text-4xl font-semibold text-white">Strategy Settings</h1>
      <SettingsForm />
    </section>
  );
}
