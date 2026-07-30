import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

const schema = z.object({
  bezeichnung: z.string().min(1).optional(),
  lagerplatz: z.string().min(1).optional(),
  menge: z.number().int().min(1).optional(),
  bestellt: z.boolean().optional(),
});

async function checkAccess(auftragId: string, userId: string, isAdmin: boolean) {
  const auftrag = await prisma.auftrag.findUnique({ where: { id: auftragId } });
  if (!auftrag) return { ok: false, status: 404, error: "Auftrag nicht gefunden" };
  if (!isAdmin && auftrag.zugewiesenAnId !== userId) {
    return { ok: false, status: 403, error: "Kein Zugriff auf diesen Auftrag" };
  }
  return { ok: true };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ersatzteilId: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id, ersatzteilId } = await params;
  const access = await checkAccess(id, session!.userId, session!.role === "ADMIN");
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const ersatzteil = await prisma.ersatzteil.update({
    where: { id: ersatzteilId },
    data: parsed.data,
  });

  return NextResponse.json(ersatzteil);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; ersatzteilId: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id, ersatzteilId } = await params;
  const access = await checkAccess(id, session!.userId, session!.role === "ADMIN");
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  await prisma.ersatzteil.delete({ where: { id: ersatzteilId } });
  return NextResponse.json({ ok: true });
}
