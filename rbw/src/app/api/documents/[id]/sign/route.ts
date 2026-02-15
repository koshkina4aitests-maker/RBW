import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { mutateDb } from "@/lib/store";

export const dynamic = "force-dynamic";

function nowIso() {
  return new Date().toISOString();
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const result = await mutateDb((db) => {
    const doc = db.documents.find((d) => d.id === id);
    if (!doc) return { ok: false as const, status: 404 as const };

    if (doc.status !== "На подписи") {
      return { ok: false as const, status: 400 as const, error: "invalid_status" as const };
    }

    doc.status = "Подписан";

    for (const n of db.notifications) {
      if (
        n.status === "open" &&
        n.kind === "signature" &&
        n.actionUrl === `/documents/${id}`
      ) {
        n.status = "done";
        n.seenAt ??= nowIso();
      }
    }

    db.events.unshift({
      id: `evt_${crypto.randomUUID()}`,
      createdAt: nowIso(),
      entityType: "document",
      entityId: id,
      message: `Документ ${id} подписан.`,
    });

    return { ok: true as const, document: doc };
  });

  if (!result.ok) {
    if (result.status === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: result.error ?? "bad_request" }, { status: 400 });
  }

  return NextResponse.json({ document: result.document });
}

