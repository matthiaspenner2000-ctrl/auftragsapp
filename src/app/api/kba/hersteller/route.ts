import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { normalizeHersteller } from "@/lib/kba";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const rows = await prisma.kbaTyp.findMany({
    distinct: ["hersteller"],
    select: { hersteller: true },
  });

  const namen = [...new Set(rows.map((r) => normalizeHersteller(r.hersteller)))].sort((a, b) =>
    a.localeCompare(b, "de")
  );

  return NextResponse.json(namen);
}
