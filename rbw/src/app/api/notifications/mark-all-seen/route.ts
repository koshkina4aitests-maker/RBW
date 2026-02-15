import { NextResponse } from "next/server";
import { markAllNotificationsSeen } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const count = await markAllNotificationsSeen();
  return NextResponse.json({ count });
}

