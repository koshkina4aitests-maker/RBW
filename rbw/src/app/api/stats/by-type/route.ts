import { NextResponse } from "next/server";
import { listTasks } from "@/lib/store";
import type { TaskType } from "@/lib/types";

export const dynamic = "force-dynamic";

const taskTypes: TaskType[] = ["Документы", "Продажи", "HR", "ИТ", "Маркетинг"];

export async function GET() {
  const tasks = await listTasks();

  const items = taskTypes.map((type) => {
    const bucket = tasks.filter((t) => t.type === type);
    const total = bucket.length;
    const done = bucket.filter((t) => t.status === "Завершена").length;
    const overdue = bucket.filter((t) => t.status === "Просрочена").length;
    const approval = bucket.filter((t) => t.status === "На согласовании").length;
    const inProgress = bucket.filter((t) => t.status === "В работе" || t.status === "Новая").length;
    const completionRate = total ? Math.round((done / total) * 100) : 0;
    return { type, total, done, inProgress, approval, overdue, completionRate };
  });

  return NextResponse.json({ items });
}

