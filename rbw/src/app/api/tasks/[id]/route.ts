import { NextResponse } from "next/server";
import { z } from "zod";
import { updateTask } from "@/lib/store";

export const dynamic = "force-dynamic";

const PatchSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    type: z.enum(["Документы", "Продажи", "HR", "ИТ", "Маркетинг"]).optional(),
    status: z
      .enum(["Новая", "В работе", "На согласовании", "Завершена", "Просрочена"])
      .optional(),
    priority: z.enum(["Низкий", "Средний", "Высокий"]).optional(),
    assigneeId: z.string().min(1).optional(),
    dueAt: z.string().datetime().nullable().optional(),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const patch = { ...parsed.data } as Record<string, unknown>;
  if (patch.dueAt === null) patch.dueAt = undefined;

  const task = await updateTask(id, patch as never);
  if (!task) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ task });
}

