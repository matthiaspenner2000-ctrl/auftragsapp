import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { normalizeHersteller } from "@/lib/kba";

export async function GET(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const hsn = request.nextUrl.searchParams.get("hsn")?.trim().toUpperCase();
  const tsn = request.nextUrl.searchParams.get("tsn")?.trim().toUpperCase();

  if (!hsn || !tsn) {
    return NextResponse.json({ error: "hsn und tsn erforderlich" }, { status: 400 });
  }

  const eintrag = await prisma.kbaTyp.findUnique({
    where: { hsn_tsn: { hsn, tsn } },
  });

  if (!eintrag) {
    return NextResponse.json({ error: "Keine KBA-Daten für diese HSN/TSN gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    hersteller: normalizeHersteller(eintrag.hersteller),
    handelsname: eintrag.handelsname,
  });
}
