import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardsPage() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Дашборды</h1>
          <p className="mt-1 text-sm text-slate-600">
            Выполнение задач и просрочки в разрезе типов задач и сотрудников.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tasks"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            К задачам
          </Link>
          <Link
            href="/analytics"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Открыть аналитику
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Выполнение по типам задач</div>
          <div className="mt-1 text-xs text-slate-500">
            План/факт, завершенные, на согласовании и просроченные.
          </div>
          <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
            Здесь будет график (bar/stacked)
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Контроль сроков</div>
          <div className="mt-1 text-xs text-slate-500">
            Важные задачи, которые скоро “сгорят”.
          </div>
          <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
            Здесь будет список “в зоне риска”
          </div>
        </div>
      </div>
    </div>
  );
}

