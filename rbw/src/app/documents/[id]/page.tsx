import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DocumentPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">Документ</div>
          <h1 className="text-xl font-semibold tracking-tight">Карточка документа #{id}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Здесь будет согласование/подписание и история действий.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/documents"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
          >
            Назад в реестр
          </Link>
          <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            Согласовать
          </button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Подписать
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold">Содержание / вложения</div>
          <div className="mt-4 grid place-items-center rounded-xl bg-slate-50 p-10 text-sm text-slate-500">
            Превью документа (PDF/HTML) — позже
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">Статус и маршрут</div>
          <div className="mt-1 text-xs text-slate-500">
            Кто согласует, кто подписывает, сроки.
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Статус</div>
              <div className="font-semibold">—</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Срок</div>
              <div className="font-semibold">—</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

