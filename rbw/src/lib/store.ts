import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Db, Document, Employee, Notification, Task } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "rbw.json");

let globalLock: Promise<void> = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = globalLock.then(async () => {
    // no-op
  });
  globalLock = next;
  // Serialize by chaining on current lock.
  const run = globalLock.then(fn, fn);
  globalLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function nowIso() {
  return new Date().toISOString();
}

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function id(prefix?: string) {
  const raw = crypto.randomUUID();
  return prefix ? `${prefix}_${raw}` : raw;
}

function seedDb(): Db {
  const employees: Employee[] = [
    { id: "emp_anna", name: "Анна Смирнова", role: "Юрист", department: "Юридический" },
    { id: "emp_ivan", name: "Иван Петров", role: "Руководитель продаж", department: "Продажи" },
    { id: "emp_elena", name: "Елена Кузнецова", role: "HR-менеджер", department: "HR" },
    { id: "emp_dmitry", name: "Дмитрий Соколов", role: "ИТ-специалист", department: "ИТ" },
    { id: "emp_olga", name: "Ольга Иванова", role: "Маркетолог", department: "Маркетинг" },
  ];

  const tasks: Task[] = [
    {
      id: "task_1001",
      title: "Подготовить проект договора с поставщиком",
      description: "Нужна финальная версия договора и риски по условиям оплаты.",
      type: "Документы",
      status: "На согласовании",
      priority: "Высокий",
      assigneeId: "emp_anna",
      createdAt: addDays(-5),
      dueAt: addDays(1),
    },
    {
      id: "task_1002",
      title: "План продаж на неделю (обновить)",
      description: "С учётом новых лидов и статуса сделок.",
      type: "Продажи",
      status: "В работе",
      priority: "Средний",
      assigneeId: "emp_ivan",
      createdAt: addDays(-3),
      dueAt: addDays(2),
    },
    {
      id: "task_1003",
      title: "Закрыть вакансию аналитика",
      description: "Согласовать оффер и дату выхода.",
      type: "HR",
      status: "В работе",
      priority: "Высокий",
      assigneeId: "emp_elena",
      createdAt: addDays(-8),
      dueAt: addDays(-1),
    },
    {
      id: "task_1004",
      title: "Проверить доступы в CRM",
      description: "Проблемы с доступом у новых сотрудников.",
      type: "ИТ",
      status: "Новая",
      priority: "Средний",
      assigneeId: "emp_dmitry",
      createdAt: addDays(-1),
      dueAt: addDays(4),
    },
    {
      id: "task_1005",
      title: "Запуск кампании в соцсетях",
      description: "Подготовить креативы и медиаплан.",
      type: "Маркетинг",
      status: "В работе",
      priority: "Средний",
      assigneeId: "emp_olga",
      createdAt: addDays(-2),
      dueAt: addDays(5),
    },
  ];

  const documents: Document[] = [
    {
      id: "DOC-1003",
      title: "Договор с поставщиком №42",
      status: "На согласовании",
      relatedTaskId: "task_1001",
      createdAt: addDays(-5),
      dueAt: addDays(1),
      approverId: "emp_anna",
      signerId: "emp_ivan",
    },
    {
      id: "DOC-1007",
      title: "Приказ о приёме сотрудника",
      status: "На подписи",
      relatedTaskId: "task_1003",
      createdAt: addDays(-4),
      dueAt: addDays(0),
      approverId: "emp_elena",
      signerId: "emp_ivan",
    },
  ];

  const notifications: Notification[] = [
    {
      id: "not_1",
      kind: "approval",
      severity: "warning",
      status: "open",
      title: "Требуется согласование документа",
      body: "Договор с поставщиком №42 ожидает согласования.",
      actionLabel: "Открыть документ",
      actionUrl: "/documents/DOC-1003",
      createdAt: addDays(-1),
    },
    {
      id: "not_2",
      kind: "signature",
      severity: "danger",
      status: "open",
      title: "Требуется подпись",
      body: "Приказ о приёме сотрудника ожидает подписи сегодня.",
      actionLabel: "Перейти к подписи",
      actionUrl: "/documents/DOC-1007",
      createdAt: addDays(-0.2),
    },
    {
      id: "not_3",
      kind: "overdue",
      severity: "danger",
      status: "open",
      title: "Просрочена задача",
      body: "«Закрыть вакансию аналитика» просрочена. Нужна эскалация/перепланирование.",
      actionLabel: "Открыть задачи",
      actionUrl: "/tasks",
      createdAt: addDays(-0.5),
    },
  ];

  return {
    employees,
    tasks,
    documents,
    notifications,
    events: [
      {
        id: id("evt"),
        createdAt: nowIso(),
        entityType: "notification",
        entityId: "not_2",
        message: "Создано уведомление о необходимости подписи.",
      },
    ],
  };
}

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const db = seedDb();
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
  }
}

export async function readDb(): Promise<Db> {
  await ensureDbFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw) as Db;
}

export async function writeDb(db: Db): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

export async function getDb(): Promise<Db> {
  return withLock(readDb);
}

export async function mutateDb<T>(mutator: (db: Db) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const db = await readDb();
    const out = await mutator(db);
    await writeDb(db);
    return out;
  });
}

export function deriveOverdueStatus(task: Task): Task {
  if (task.status === "Завершена") return task;
  if (!task.dueAt) return task;
  const due = new Date(task.dueAt).getTime();
  if (Number.isNaN(due)) return task;
  if (due < Date.now()) {
    return { ...task, status: "Просрочена" };
  }
  return task;
}

export async function listEmployees(): Promise<Employee[]> {
  const db = await getDb();
  return db.employees;
}

export async function listTasks(): Promise<Task[]> {
  const db = await getDb();
  // Derive overdue at read time (without mutating file).
  return db.tasks.map(deriveOverdueStatus);
}

export async function createTask(input: Omit<Task, "id" | "createdAt">): Promise<Task> {
  return mutateDb((db) => {
    const task: Task = {
      ...input,
      id: id("task"),
      createdAt: nowIso(),
    };
    db.tasks.unshift(task);
    db.events.unshift({
      id: id("evt"),
      createdAt: nowIso(),
      entityType: "task",
      entityId: task.id,
      message: `Создана задача «${task.title}».`,
    });
    return task;
  });
}

export async function updateTask(taskId: string, patch: Partial<Task>): Promise<Task | null> {
  return mutateDb((db) => {
    const idx = db.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return null;
    db.tasks[idx] = { ...db.tasks[idx], ...patch };
    db.events.unshift({
      id: id("evt"),
      createdAt: nowIso(),
      entityType: "task",
      entityId: taskId,
      message: `Обновлена задача ${taskId}.`,
    });
    return db.tasks[idx];
  });
}

export async function listDocuments(): Promise<Document[]> {
  const db = await getDb();
  return db.documents;
}

export async function getDocument(docId: string): Promise<Document | null> {
  const db = await getDb();
  return db.documents.find((d) => d.id === docId) ?? null;
}

export async function updateDocument(docId: string, patch: Partial<Document>): Promise<Document | null> {
  return mutateDb((db) => {
    const idx = db.documents.findIndex((d) => d.id === docId);
    if (idx === -1) return null;
    db.documents[idx] = { ...db.documents[idx], ...patch };
    db.events.unshift({
      id: id("evt"),
      createdAt: nowIso(),
      entityType: "document",
      entityId: docId,
      message: `Обновлён документ ${docId}.`,
    });
    return db.documents[idx];
  });
}

export async function listNotifications(status?: "open" | "done"): Promise<Notification[]> {
  const db = await getDb();
  const all = db.notifications.slice();
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return status ? all.filter((n) => n.status === status) : all;
}

export async function countOpenNotifications(): Promise<number> {
  const db = await getDb();
  return db.notifications.filter((n) => n.status === "open").length;
}

export async function markNotificationSeen(notificationId: string): Promise<Notification | null> {
  return mutateDb((db) => {
    const idx = db.notifications.findIndex((n) => n.id === notificationId);
    if (idx === -1) return null;
    if (!db.notifications[idx].seenAt) db.notifications[idx].seenAt = nowIso();
    return db.notifications[idx];
  });
}

export async function resolveNotification(notificationId: string): Promise<Notification | null> {
  return mutateDb((db) => {
    const idx = db.notifications.findIndex((n) => n.id === notificationId);
    if (idx === -1) return null;
    db.notifications[idx].status = "done";
    if (!db.notifications[idx].seenAt) db.notifications[idx].seenAt = nowIso();
    db.events.unshift({
      id: id("evt"),
      createdAt: nowIso(),
      entityType: "notification",
      entityId: notificationId,
      message: `Закрыто уведомление ${notificationId}.`,
    });
    return db.notifications[idx];
  });
}

export async function markAllNotificationsSeen(): Promise<number> {
  return mutateDb((db) => {
    const ts = nowIso();
    let count = 0;
    for (const n of db.notifications) {
      if (!n.seenAt) {
        n.seenAt = ts;
        count++;
      }
    }
    return count;
  });
}

