import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Аналитическая отчетность</h1>
          <p className="mt-1 text-sm text-slate-600">
            Тренды выполнения, “узкие места” и распределение нагрузки.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboards"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            К дашбордам
          </Link>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Сформировать отчет
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold">Динамика выполнения (по неделям)</div>
          <div className="mt-1 text-xs text-slate-500">
            Завершено / создано / просрочено.
          </div>
          <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
            Здесь будет линейный график
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Сводка</div>
          <div className="mt-1 text-xs text-slate-500">
            Распределение нагрузки по сотрудникам и типам.
          </div>
          <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
            Здесь будет breakdown
          </div>
        </div>
      </div>
    </div>
  );
}

