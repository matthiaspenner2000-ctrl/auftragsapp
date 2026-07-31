import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireAdmin } from "@/lib/auth-guards";
import { getSession } from "@/lib/session";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
  role: z.enum(["ADMIN", "MITARBEITER"]).optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
  }

  const { password, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (password) {
    data.passwordHash = await hashPassword(password);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const session = await getSession();
  const { id } = await params;

  if (id === session!.userId) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst löschen" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Mitarbeiter nicht gefunden" }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Der letzte Admin-Account kann nicht gelöscht werden" }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
