import Link from "next/link";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/auftraege" className="text-lg font-semibold text-zinc-900">
              AuftragsApp
            </Link>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <Link href="/auftraege" className="hover:text-zinc-900">
                Aufträge
              </Link>
              <Link href="/fahrzeuge" className="hover:text-zinc-900">
                Fahrzeuge
              </Link>
              {session?.role === "ADMIN" && (
                <>
                  <Link href="/admin/mitarbeiter" className="hover:text-zinc-900">
                    Mitarbeiter
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            {session && (
              <span>
                {session.name}{" "}
                <span className="text-zinc-400">
                  ({session.role === "ADMIN" ? "Admin" : "Mitarbeiter"})
                </span>
              </span>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
