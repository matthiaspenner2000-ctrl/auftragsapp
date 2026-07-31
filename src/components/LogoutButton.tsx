"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-indigo-400 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
    >
      Abmelden
    </button>
  );
}
