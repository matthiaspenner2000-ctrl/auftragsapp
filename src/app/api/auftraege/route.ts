import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth-guards";

export async function GET(request: NextRequest) {
  const { session, response } = await requireSession();
  if (response) return response;

  const status = request.nextUrl.searchParams.get("status");
  const vehicleId = request.nextUrl.searchParams.get("vehicleId");

  const where: Record<string, unknown> = {};
  if (session!.role !== "ADMIN") {
    where.zugewiesenAnId = session!.userId;
  }
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = vehicleId;

  const auftraege = await prisma.auftrag.findMany({
    where,
    orderBy: [{ prioritaet: "asc" }, { createdAt: "desc" }],
    include: {
      vehicle: true,
      zugewiesenAn: { select: { id: true, name: true } },
      erstelltVon: { select: { id: true, name: true } },
      _count: { select: { dateien: true, ersatzteile: true } },
    },
  });

  return NextResponse.json(auftraege);
}

const ersatzteilSchema = z.object({
  bezeichnung: z.string().min(1),
  lagerplatz: z.string().min(1),
  menge: z.number().int().min(1).default(1),
});

const createAuftragSchema = z.object({
  titel: z.string().min(1),
  beschreibung: z.string().min(1),
  vehicleId: z.string().min(1),
  zugewiesenAnId: z.string().min(1).optional().nullable(),
  prioritaet: z.number().int().min(1).max(3).default(2),
  faelligAm: z.string().datetime().optional().nullable(),
  ersatzteile: z.array(ersatzteilSchema).optional().default([]),
});

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createAuftragSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const { ersatzteile, faelligAm, ...rest } = parsed.data;

  const auftrag = await prisma.auftrag.create({
    data: {
      ...rest,
      faelligAm: faelligAm ? new Date(faelligAm) : null,
      erstelltVonId: session!.userId,
      ersatzteile: {
        create: ersatzteile,
      },
    },
    include: { vehicle: true, zugewiesenAn: true, ersatzteile: true },
  });

  return NextResponse.json(auftrag, { status: 201 });
}
