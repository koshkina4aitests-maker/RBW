import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const documents = await listDocuments();
  return NextResponse.json({ documents });
}

