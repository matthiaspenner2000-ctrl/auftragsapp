import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

async function loadAuftrag(id: string) {
  return prisma.auftrag.findUnique({
    where: { id },
    include: {
      vehicle: true,
      zugewiesenAn: { select: { id: true, name: true, email: true } },
      erstelltVon: { select: { id: true, name: true } },
      ersatzteile: true,
      dateien: {
        include: { hochgeladenVon: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      kommentare: {
        include: { autor: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const auftrag = await loadAuftrag(id);
  if (!auftrag) {
    return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });
  }

  if (session!.role !== "ADMIN" && auftrag.zugewiesenAnId !== session!.userId) {
    return NextResponse.json({ error: "Kein Zugriff auf diesen Auftrag" }, { status: 403 });
  }

  return NextResponse.json(auftrag);
}

const updateAuftragSchema = z.object({
  titel: z.string().min(1).optional(),
  beschreibung: z.string().min(1).optional(),
  status: z.enum(["OFFEN", "IN_ARBEIT", "WARTET_AUF_TEILE", "ERLEDIGT"]).optional(),
  zugewiesenAnId: z.string().min(1).nullable().optional(),
  prioritaet: z.number().int().min(1).max(3).optional(),
  faelligAm: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.auftrag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });
  }

  const isAdmin = session!.role === "ADMIN";
  const isAssignee = existing.zugewiesenAnId === session!.userId;
  if (!isAdmin && !isAssignee) {
    return NextResponse.json({ error: "Kein Zugriff auf diesen Auftrag" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateAuftragSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const data = { ...parsed.data } as Record<string, unknown>;

  if (!isAdmin) {
    // Mitarbeiter dürfen nur den Status ändern, keine Neuzuweisung/Details.
    for (const key of Object.keys(data)) {
      if (key !== "status") delete data[key];
    }
  }

  if (data.faelligAm) {
    data.faelligAm = new Date(data.faelligAm as string);
  }

  const auftrag = await prisma.auftrag.update({
    where: { id },
    data,
    include: {
      vehicle: true,
      zugewiesenAn: { select: { id: true, name: true } },
      ersatzteile: true,
    },
  });

  return NextResponse.json(auftrag);
}
