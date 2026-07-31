import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

export async function GET(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const vehicles = await prisma.vehicle.findMany({
    where: q
      ? {
          OR: [
            { kennzeichen: { contains: q, mode: "insensitive" } },
            { marke: { contains: q, mode: "insensitive" } },
            { modell: { contains: q, mode: "insensitive" } },
            { kundeName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { auftraege: true } } },
  });

  return NextResponse.json(vehicles);
}

const createVehicleSchema = z.object({
  kennzeichen: z.string().min(1),
  marke: z.string().min(1),
  modell: z.string().min(1),
  hsn: z.string().optional().nullable(),
  tsn: z.string().optional().nullable(),
  baujahr: z.number().int().optional().nullable(),
  vin: z.string().optional().nullable(),
  farbe: z.string().optional().nullable(),
  kilometerstand: z.number().int().optional().nullable(),
  kundeName: z.string().optional().nullable(),
  kundeTelefon: z.string().optional().nullable(),
  kundeEmail: z.string().optional().nullable(),
  notizen: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const existing = await prisma.vehicle.findUnique({ where: { kennzeichen: parsed.data.kennzeichen } });
  if (existing) {
    return NextResponse.json({ error: "Kennzeichen ist bereits erfasst" }, { status: 409 });
  }

  const vehicle = await prisma.vehicle.create({ data: parsed.data });
  return NextResponse.json(vehicle, { status: 201 });
}
