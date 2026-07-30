import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

const schema = z.object({ text: z.string().min(1) });

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
    return NextResponse.json({ error: "Text erforderlich" }, { status: 400 });
  }

  const kommentar = await prisma.auftragKommentar.create({
    data: {
      text: parsed.data.text,
      auftragId: id,
      autorId: session!.userId,
    },
    include: { autor: { select: { id: true, name: true } } },
  });

  return NextResponse.json(kommentar, { status: 201 });
}
