import { NextResponse } from "next/server";
import { listEmployees, listTasks } from "@/lib/store";
import type { TaskStatus, TaskType } from "@/lib/types";

export const dynamic = "force-dynamic";

const statuses: TaskStatus[] = ["Новая", "В работе", "На согласовании", "Просрочена", "Завершена"];
const types: TaskType[] = ["Документы", "Продажи", "HR", "ИТ", "Маркетинг"];

export async function GET() {
  const [tasks, employees] = await Promise.all([listTasks(), listEmployees()]);

  const tasksByStatus = statuses.map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));

  const tasksByType = types.map((type) => ({
    type,
    count: tasks.filter((t) => t.type === type).length,
  }));

  const byAssignee = employees
    .map((e) => {
      const mine = tasks.filter((t) => t.assigneeId === e.id);
      const active = mine.filter((t) => t.status !== "Завершена").length;
      const overdue = mine.filter((t) => t.status === "Просрочена").length;
      return { employeeId: e.id, name: e.name, active, overdue, total: mine.length };
    })
    .sort((a, b) => b.active - a.active);

  return NextResponse.json({ tasksByStatus, tasksByType, byAssignee });
}

