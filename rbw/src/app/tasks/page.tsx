import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Задачи</h1>
          <p className="mt-1 text-sm text-slate-600">
            Постановка задач сотрудникам и контроль исполнения.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Новая задача
          </button>
          <Link
            href="/dashboards"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            Смотреть дашборды
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Список задач</div>
        <div className="mt-1 text-xs text-slate-500">
          Здесь будут фильтры по типам задач, статусам и исполнителям, а также создание и
          редактирование.
        </div>
        <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
          Данные и форма создания — на следующем шаге
        </div>
      </div>
    </div>
  );
}

