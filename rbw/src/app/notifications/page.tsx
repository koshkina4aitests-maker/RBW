import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotificationsPage() {
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Уведомления</h1>
          <p className="mt-1 text-sm text-slate-600">
            Действия, требующие внимания: согласования, подписи, контроль сроков.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/documents"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            Документы
          </Link>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
            Отметить всё прочитанным
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold">Список уведомлений</div>
        <div className="mt-1 text-xs text-slate-500">
          Будут отображаться уведомления с кнопками “Перейти”, “Согласовать”, “Подписать”.
        </div>
        <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
          Данные и поп-ап “требуется действие” — на следующем шаге
        </div>
      </div>
    </div>
  );
}

