import { NextResponse } from "next/server";
import { listEmployees } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const employees = await listEmployees();
  return NextResponse.json({ employees });
}

