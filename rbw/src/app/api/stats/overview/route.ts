import { NextResponse } from "next/server";
import { countOpenNotifications, listDocuments, listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tasks, docs, openNotifications] = await Promise.all([
    listTasks(),
    listDocuments(),
    countOpenNotifications(),
  ]);

  const activeTasks = tasks.filter((t) => t.status !== "Завершена").length;
  const overdueTasks = tasks.filter((t) => t.status === "Просрочена").length;
  const onApproval = tasks.filter((t) => t.status === "На согласовании").length;
  const docsApproval = docs.filter((d) => d.status === "На согласовании").length;
  const docsSign = docs.filter((d) => d.status === "На подписи").length;

  return NextResponse.json({
    kpi: {
      activeTasks,
      overdueTasks,
      onApproval: onApproval + docsApproval,
      toSign: docsSign,
      openNotifications,
    },
  });
}

