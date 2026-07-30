import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { deleteFile, getDownloadUrl } from "@/lib/s3";

async function loadDateiWithAccessCheck(
  auftragId: string,
  dateiId: string,
  userId: string,
  isAdmin: boolean
) {
  const auftrag = await prisma.auftrag.findUnique({ where: { id: auftragId } });
  if (!auftrag) return { error: "Auftrag nicht gefunden", status: 404 } as const;
  if (!isAdmin && auftrag.zugewiesenAnId !== userId) {
    return { error: "Kein Zugriff auf diesen Auftrag", status: 403 } as const;
  }
  const datei = await prisma.auftragDatei.findUnique({ where: { id: dateiId } });
  if (!datei || datei.auftragId !== auftragId) {
    return { error: "Datei nicht gefunden", status: 404 } as const;
  }
  return { datei } as const;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; dateiId: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id, dateiId } = await params;
  const result = await loadDateiWithAccessCheck(id, dateiId, session!.userId, session!.role === "ADMIN");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const url = await getDownloadUrl(result.datei.s3Key);
  return NextResponse.json({ url });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; dateiId: string }> }
) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { id, dateiId } = await params;
  const result = await loadDateiWithAccessCheck(id, dateiId, session!.userId, session!.role === "ADMIN");
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await deleteFile(result.datei.s3Key);
  await prisma.auftragDatei.delete({ where: { id: dateiId } });

  return NextResponse.json({ ok: true });
}
