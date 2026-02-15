import Link from "next/link";
import { OverviewKpis } from "@/components/overview-kpis";

export default function Home() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Обзор</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ключевые показатели и ближайшие действия по задачам и документам.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tasks"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Поставить задачу
          </Link>
          <Link
            href="/notifications"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            Открыть уведомления
          </Link>
        </div>
      </div>

      <OverviewKpis />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Дашборд по типам задач</div>
              <div className="mt-1 text-xs text-slate-500">
                Выполнение, просрочки и задачи на согласовании.
              </div>
            </div>
            <Link
              href="/dashboards"
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
            >
              Перейти в дашборды
            </Link>
          </div>
          <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
            Графики появятся после подключения данных
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Требуют действий</div>
              <div className="mt-1 text-xs text-slate-500">
                Согласование / подписание / контроль сроков
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            <div className="rounded-xl border border-black/10 bg-white p-3 text-sm">
              <div className="font-semibold">—</div>
              <div className="mt-1 text-xs text-slate-500">
                Здесь будут показаны уведомления, требующие действия
              </div>
            </div>
            <Link
              href="/notifications"
              className="mt-1 rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Открыть список уведомлений
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
