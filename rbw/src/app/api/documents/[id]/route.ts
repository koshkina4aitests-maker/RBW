import { NextResponse } from "next/server";
import { getDocument } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ document });
}

