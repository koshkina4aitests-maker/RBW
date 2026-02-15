import { NextResponse } from "next/server";
import { z } from "zod";
import { markNotificationSeen, resolveNotification } from "@/lib/store";

export const dynamic = "force-dynamic";

const PatchSchema = z
  .object({
    action: z.enum(["seen", "resolve"]),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as unknown;
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const notification =
    parsed.data.action === "seen"
      ? await markNotificationSeen(id)
      : await resolveNotification(id);

  if (!notification) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ notification });
}

