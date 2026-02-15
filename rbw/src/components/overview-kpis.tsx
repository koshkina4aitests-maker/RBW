"use client";

import { useEffect, useState } from "react";

type OverviewResponse = {
  kpi: {
    activeTasks: number;
    overdueTasks: number;
    onApproval: number;
    toSign: number;
    openNotifications: number;
  };
};

export function OverviewKpis() {
  const [data, setData] = useState<OverviewResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/stats/overview", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as OverviewResponse;
        if (!cancelled) setData(json);
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const k = data?.kpi;

  return (
    <section className="grid gap-3 md:grid-cols-4">
      <KpiCard
        label="Активные задачи"
        value={k ? String(k.activeTasks) : "—"}
        hint="В работе / на согласовании"
      />
      <KpiCard
        label="Просрочено"
        value={k ? String(k.overdueTasks) : "—"}
        hint="Требует внимания"
        tone="danger"
      />
      <KpiCard
        label="На согласовании"
        value={k ? String(k.onApproval) : "—"}
        hint="Ожидают решения"
        tone="warning"
      />
      <KpiCard
        label="Требует подписи"
        value={k ? String(k.toSign) : "—"}
        hint="Документы к подписанию"
      />
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "danger" | "warning";
}) {
  const accent =
    tone === "danger"
      ? "bg-rose-50 text-rose-700"
      : tone === "warning"
        ? "bg-amber-50 text-amber-700"
        : "bg-blue-50 text-blue-700";

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className={`rounded-full px-2 py-1 text-[11px] font-semibold ${accent}`}>
          KPI
        </div>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

