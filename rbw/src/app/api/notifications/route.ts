import { NextResponse } from "next/server";
import { listNotifications } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const notifications = await listNotifications(
    status === "open" || status === "done" ? status : undefined,
  );
  return NextResponse.json({ notifications });
}

