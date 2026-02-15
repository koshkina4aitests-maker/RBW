"use client";

import {
  BarChart3,
  CheckSquare,
  FileText,
  LayoutDashboard,
  LineChart,
  MessageSquareWarning,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { NotificationBell } from "@/components/notification-bell";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "Обзор", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/tasks", label: "Задачи", icon: <CheckSquare className="h-4 w-4" /> },
  { href: "/dashboards", label: "Дашборды", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/analytics", label: "Аналитика", icon: <LineChart className="h-4 w-4" /> },
  {
    href: "/notifications",
    label: "Уведомления",
    icon: <MessageSquareWarning className="h-4 w-4" />,
  },
  { href: "/documents", label: "Документы", icon: <FileText className="h-4 w-4" /> },
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-dvh max-w-[1400px] gap-6 px-4 py-5 sm:px-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-5 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                <span className="text-sm font-semibold">АРМ</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">АРМ руководителя</div>
                <div className="text-xs text-slate-500">Задачи · Аналитика · Действия</div>
              </div>
            </div>

            <nav className="mt-3 grid gap-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg border border-transparent",
                        active ? "bg-white/70" : "bg-slate-50",
                      )}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">Подсказка</div>
              <div className="mt-1 leading-relaxed">
                Уведомления подсвечивают действия: согласование, подпись, контроль сроков.
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <header className="sticky top-0 z-10 -mx-4 px-4 pt-1 sm:-mx-6 sm:px-6">
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="md:hidden">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    >
                      АРМ
                    </Link>
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <div className="truncate text-sm font-semibold">
                      Автоматизированное рабочее место руководителя
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      Постановка задач · Контроль исполнения · Аналитическая отчетность
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm lg:flex">
                    <Search className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Поиск (скоро)</span>
                  </div>
                  <NotificationBell />
                  <div className="hidden sm:block">
                    <div className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-sm">
                      <div className="text-xs text-slate-500">Пользователь</div>
                      <div className="font-semibold leading-tight">Руководитель</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>

          <footer className="pb-6 pt-2 text-center text-xs text-slate-500">
            RBW · демо-версия АРМ руководителя
          </footer>
        </div>
      </div>
    </div>
  );
}

