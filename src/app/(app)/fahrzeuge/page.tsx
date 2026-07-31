"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";

export default function FahrzeugePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load(q?: string) {
    setLoading(true);
    const url = q ? `/api/vehicles?q=${encodeURIComponent(q)}` : "/api/vehicles";
    const res = await fetch(url);
    if (res.ok) setVehicles(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialer Datenabruf beim Mount
    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(query);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Fahrzeuge</h1>
        <Link
          href="/fahrzeuge/neu"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Fahrzeug anlegen
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche nach Kennzeichen, Marke, Modell oder Kunde…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Suchen
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Lädt…</p>
      ) : vehicles.length === 0 ? (
        <p className="text-sm text-slate-500">Keine Fahrzeuge gefunden.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link
              key={v.id}
              href={`/fahrzeuge/${v.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md"
            >
              <p className="text-lg font-semibold text-slate-900">{v.kennzeichen}</p>
              <p className="text-sm text-slate-600">
                {v.marke} {v.modell} {v.baujahr ? `(${v.baujahr})` : ""}
              </p>
              {v.kundeName && <p className="mt-1 text-sm text-slate-500">Kunde: {v.kundeName}</p>}
              <p className="mt-2 text-xs text-slate-400">
                {v._count?.auftraege ?? 0} Auftrag/Aufträge in der Kartei
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
