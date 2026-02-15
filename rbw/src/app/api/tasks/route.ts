import { NextResponse } from "next/server";
import { z } from "zod";
import { createTask, listTasks } from "@/lib/store";
import type { TaskPriority, TaskStatus, TaskType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TaskTypeSchema = z.enum(["Документы", "Продажи", "HR", "ИТ", "Маркетинг"]);
const TaskStatusSchema = z.enum(["Новая", "В работе", "На согласовании", "Завершена", "Просрочена"]);
const TaskPrioritySchema = z.enum(["Низкий", "Средний", "Высокий"]);

const CreateTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: TaskTypeSchema,
  priority: TaskPrioritySchema.default("Средний"),
  assigneeId: z.string().min(1),
  dueAt: z.string().datetime().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") as TaskType | null;
  const status = url.searchParams.get("status") as TaskStatus | null;
  const assigneeId = url.searchParams.get("assigneeId");
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();

  const tasks = await listTasks();
  const filtered = tasks.filter((t) => {
    if (type && t.type !== type) return false;
    if (status && t.status !== status) return false;
    if (assigneeId && t.assigneeId !== assigneeId) return false;
    if (q) {
      const hay = `${t.title} ${t.description ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json({ tasks: filtered });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const task = await createTask({
    title: input.title,
    description: input.description,
    type: input.type,
    status: "Новая",
    priority: input.priority as TaskPriority,
    assigneeId: input.assigneeId,
    dueAt: input.dueAt,
  });

  return NextResponse.json({ task }, { status: 201 });
}

