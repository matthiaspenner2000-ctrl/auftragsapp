import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 }) };
  }
  return { session, response: null };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 }) };
  }
  if (session.role !== "ADMIN") {
    return { session: null, response: NextResponse.json({ error: "Nur für Admins" }, { status: 403 }) };
  }
  return { session, response: null };
}
