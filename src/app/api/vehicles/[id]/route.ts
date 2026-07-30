import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      auftraege: {
        orderBy: { createdAt: "desc" },
        include: {
          zugewiesenAn: { select: { id: true, name: true } },
          erstelltVon: { select: { id: true, name: true } },
          dateien: true,
          ersatzteile: true,
        },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Fahrzeug nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}

const updateVehicleSchema = z.object({
  kennzeichen: z.string().min(1).optional(),
  marke: z.string().min(1).optional(),
  modell: z.string().min(1).optional(),
  baujahr: z.number().int().optional().nullable(),
  vin: z.string().optional().nullable(),
  farbe: z.string().optional().nullable(),
  kilometerstand: z.number().int().optional().nullable(),
  kundeName: z.string().optional().nullable(),
  kundeTelefon: z.string().optional().nullable(),
  kundeEmail: z.string().optional().nullable(),
  notizen: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({ where: { id }, data: parsed.data });
  return NextResponse.json(vehicle);
}
