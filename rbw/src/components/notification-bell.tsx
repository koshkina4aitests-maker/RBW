"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationCountResponse = { open: number };

export function NotificationBell() {
  const [openCount, setOpenCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/notifications/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as NotificationCountResponse;
        if (!cancelled) setOpenCount(data.open ?? 0);
      } catch {
        // ignore
      }
    }

    load();
    const t = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const label = useMemo(() => {
    if (!openCount) return "Уведомления";
    return `Уведомления: ${openCount}`;
  }, [openCount]);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50"
      aria-label={label}
      title={label}
    >
      <Bell className="h-4.5 w-4.5" />
      {openCount > 0 ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white">
          {openCount > 99 ? "99+" : openCount}
        </span>
      ) : null}
    </Link>
  );
}

