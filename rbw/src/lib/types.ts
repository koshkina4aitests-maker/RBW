export type ID = string;

export type TaskType = "Документы" | "Продажи" | "HR" | "ИТ" | "Маркетинг";
export type TaskStatus =
  | "Новая"
  | "В работе"
  | "На согласовании"
  | "Завершена"
  | "Просрочена";
export type TaskPriority = "Низкий" | "Средний" | "Высокий";

export type Employee = {
  id: ID;
  name: string;
  role: string;
  department: string;
};

export type Task = {
  id: ID;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: ID;
  createdAt: string; // ISO
  dueAt?: string; // ISO
};

export type DocumentStatus = "Черновик" | "На согласовании" | "На подписи" | "Подписан" | "Отклонён";

export type Document = {
  id: ID;
  title: string;
  status: DocumentStatus;
  relatedTaskId?: ID;
  createdAt: string; // ISO
  dueAt?: string; // ISO
  approverId?: ID;
  signerId?: ID;
};

export type NotificationKind = "approval" | "signature" | "overdue" | "info";
export type NotificationSeverity = "info" | "warning" | "danger";
export type NotificationStatus = "open" | "done";

export type Notification = {
  id: ID;
  kind: NotificationKind;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  body?: string;
  actionLabel?: string;
  actionUrl?: string;
  createdAt: string; // ISO
  seenAt?: string; // ISO
};

export type AuditEvent = {
  id: ID;
  createdAt: string; // ISO
  entityType: "task" | "document" | "notification";
  entityId: ID;
  message: string;
};

export type Db = {
  employees: Employee[];
  tasks: Task[];
  documents: Document[];
  notifications: Notification[];
  events: AuditEvent[];
};

