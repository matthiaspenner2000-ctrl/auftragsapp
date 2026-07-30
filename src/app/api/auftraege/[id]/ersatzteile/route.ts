import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

const schema = z.object({
  bezeichnung: z.string().min(1),
  lagerplatz: z.string().min(1),
  menge: z.number().int().min(1).default(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const auftrag = await prisma.auftrag.findUnique({ where: { id } });
  if (!auftrag) {
    return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });
  }
  if (session!.role !== "ADMIN" && auftrag.zugewiesenAnId !== session!.userId) {
    return NextResponse.json({ error: "Kein Zugriff auf diesen Auftrag" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const ersatzteil = await prisma.ersatzteil.create({
    data: { ...parsed.data, auftragId: id },
  });

  return NextResponse.json(ersatzteil, { status: 201 });
}
