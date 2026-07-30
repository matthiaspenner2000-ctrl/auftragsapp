"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { VehicleDetail } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/types";

export default function FahrzeugKarteiPage() {
  const params = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/vehicles/${params.id}`);
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (res.ok) setVehicle(await res.json());
      setLoading(false);
    }
    load();
    fetch("/api/session")
      .then((r) => r.json())
      .then((s) => setIsAdmin(s?.role === "ADMIN"));
  }, [params.id]);

  if (loading) return <p className="text-sm text-zinc-500">Lädt…</p>;
  if (notFound || !vehicle) return <p className="text-sm text-zinc-500">Fahrzeug nicht gefunden.</p>;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{vehicle.kennzeichen}</h1>
          <p className="text-zinc-600">
            {vehicle.marke} {vehicle.modell} {vehicle.baujahr ? `(${vehicle.baujahr})` : ""}
          </p>
        </div>
        {isAdmin && (
          <Link
            href={`/admin/auftraege/neu?vehicleId=${vehicle.id}`}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            + Neuer Auftrag für dieses Fahrzeug
          </Link>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">Fahrzeugdaten</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-zinc-500">Farbe</dt>
            <dd>{vehicle.farbe ?? "–"}</dd>
            <dt className="text-zinc-500">Kilometerstand</dt>
            <dd>{vehicle.kilometerstand ? `${vehicle.kilometerstand.toLocaleString("de-DE")} km` : "–"}</dd>
            <dt className="text-zinc-500">VIN</dt>
            <dd>{vehicle.vin ?? "–"}</dd>
          </dl>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-zinc-500">Kunde</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-zinc-500">Name</dt>
            <dd>{vehicle.kundeName ?? "–"}</dd>
            <dt className="text-zinc-500">Telefon</dt>
            <dd>{vehicle.kundeTelefon ?? "–"}</dd>
            <dt className="text-zinc-500">E-Mail</dt>
            <dd>{vehicle.kundeEmail ?? "–"}</dd>
          </dl>
        </div>
      </div>

      {vehicle.notizen && (
        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-2 text-sm font-semibold text-zinc-500">Notizen</h2>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{vehicle.notizen}</p>
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold text-zinc-900">Auftragshistorie</h2>
      {vehicle.auftraege.length === 0 ? (
        <p className="text-sm text-zinc-500">Noch keine Aufträge für dieses Fahrzeug.</p>
      ) : (
        <div className="grid gap-3">
          {vehicle.auftraege.map((a) => (
            <Link
              key={a.id}
              href={`/auftraege/${a.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:border-zinc-400"
            >
              <div>
                <p className="font-medium text-zinc-900">{a.titel}</p>
                <p className="text-sm text-zinc-500">
                  {new Date(a.createdAt).toLocaleDateString("de-DE")} · Zugewiesen an:{" "}
                  {a.zugewiesenAn?.name ?? "Niemand"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[a.status]}`}>
                {STATUS_LABELS[a.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
