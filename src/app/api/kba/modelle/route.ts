import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { herstellerRohnamen } from "@/lib/kba";

export async function GET(request: NextRequest) {
  const { response } = await requireSession();
  if (response) return response;

  const hersteller = request.nextUrl.searchParams.get("hersteller")?.trim();
  if (!hersteller) {
    return NextResponse.json({ error: "hersteller erforderlich" }, { status: 400 });
  }

  const rows = await prisma.kbaTyp.findMany({
    where: { hersteller: { in: herstellerRohnamen(hersteller) } },
    distinct: ["handelsname"],
    select: { handelsname: true },
  });

  const namen = [...new Set(rows.map((r) => r.handelsname))].sort((a, b) => a.localeCompare(b, "de"));

  return NextResponse.json(namen);
}
