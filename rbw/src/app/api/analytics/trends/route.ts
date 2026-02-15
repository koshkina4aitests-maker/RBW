import { NextResponse } from "next/server";
import { listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const tasks = await listTasks();
  const now = new Date();
  const thisWeek = startOfWeek(now);

  const weeks: { weekStart: string; created: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = new Date(thisWeek);
    ws.setDate(ws.getDate() - i * 7);
    const label = isoDate(ws);
    weeks.push({ weekStart: label, created: 0 });
  }

  const index = new Map(weeks.map((w, i) => [w.weekStart, i] as const));

  for (const t of tasks) {
    const ws = startOfWeek(new Date(t.createdAt));
    const key = isoDate(ws);
    const idx = index.get(key);
    if (idx !== undefined) weeks[idx].created += 1;
  }

  return NextResponse.json({ weeks });
}

