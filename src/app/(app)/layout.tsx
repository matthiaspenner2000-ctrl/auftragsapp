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
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="bg-indigo-700 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/auftraege" className="text-lg font-bold tracking-tight text-white">
              🔧 AuftragsApp
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              <Link
                href="/auftraege"
                className="rounded-lg px-3 py-1.5 text-indigo-100 hover:bg-indigo-600 hover:text-white"
              >
                Aufträge
              </Link>
              <Link
                href="/fahrzeuge"
                className="rounded-lg px-3 py-1.5 text-indigo-100 hover:bg-indigo-600 hover:text-white"
              >
                Fahrzeuge
              </Link>
              {session?.role === "ADMIN" && (
                <Link
                  href="/admin/mitarbeiter"
                  className="rounded-lg px-3 py-1.5 text-indigo-100 hover:bg-indigo-600 hover:text-white"
                >
                  Mitarbeiter
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session && (
              <span className="text-indigo-100">
                {session.name}{" "}
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                  {session.role === "ADMIN" ? "Admin" : "Mitarbeiter"}
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
