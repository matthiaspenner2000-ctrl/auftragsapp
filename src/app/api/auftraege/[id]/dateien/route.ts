import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";
import { uploadFile, buildObjectKey } from "@/lib/s3";

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = new Set(["RECHNUNG", "FOTO", "DOKUMENT"]);

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

  const formData = await request.formData();
  const file = formData.get("file");
  const typ = formData.get("typ");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei übermittelt" }, { status: 400 });
  }
  if (typeof typ !== "string" || !ALLOWED_TYPES.has(typ)) {
    return NextResponse.json({ error: "Ungültiger Dateityp" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Datei zu groß (max. 25 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = buildObjectKey(id, file.name);

  await uploadFile(key, buffer, file.type || "application/octet-stream");

  const dateiRecord = await prisma.auftragDatei.create({
    data: {
      typ: typ as "RECHNUNG" | "FOTO" | "DOKUMENT",
      dateiname: file.name,
      s3Key: key,
      mimeType: file.type || "application/octet-stream",
      groesse: file.size,
      auftragId: id,
      hochgeladenVonId: session!.userId,
    },
    include: { hochgeladenVon: { select: { id: true, name: true } } },
  });

  return NextResponse.json(dateiRecord, { status: 201 });
}
