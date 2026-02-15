import { NextResponse } from "next/server";
import { countOpenNotifications } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const open = await countOpenNotifications();
  return NextResponse.json({ open });
}

