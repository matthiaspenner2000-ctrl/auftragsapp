"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserSummary, Vehicle } from "@/lib/types";

type ErsatzteilForm = { bezeichnung: string; lagerplatz: string; menge: number };

function NeuerAuftragForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get("vehicleId") ?? "";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mitarbeiter, setMitarbeiter] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId);
  const [zugewiesenAnId, setZugewiesenAnId] = useState("");
  const [prioritaet, setPrioritaet] = useState(2);
  const [faelligAm, setFaelligAm] = useState("");
  const [ersatzteile, setErsatzteile] = useState<ErsatzteilForm[]>([]);

  useEffect(() => {
    fetch("/api/vehicles").then((r) => r.json()).then(setVehicles);
    fetch("/api/users").then((r) => r.json()).then((users: UserSummary[]) =>
      setMitarbeiter(users.filter((u) => u.active))
    );
  }, []);

  function addErsatzteil() {
    setErsatzteile((list) => [...list, { bezeichnung: "", lagerplatz: "", menge: 1 }]);
  }

  function updateErsatzteil(index: number, field: keyof ErsatzteilForm, value: string | number) {
    setErsatzteile((list) =>
      list.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  }

  function removeErsatzteil(index: number) {
    setErsatzteile((list) => list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!vehicleId) {
      setError("Bitte ein Fahrzeug auswählen");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auftraege", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel,
        beschreibung,
        vehicleId,
        zugewiesenAnId: zugewiesenAnId || null,
        prioritaet,
        faelligAm: faelligAm ? new Date(faelligAm).toISOString() : null,
        ersatzteile: ersatzteile.filter((e) => e.bezeichnung && e.lagerplatz),
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Fehler beim Anlegen");
      return;
    }

    const auftrag = await res.json();
    router.push(`/auftraege/${auftrag.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Neuer Auftrag</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fahrzeug *</label>
          <select
            required
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">– Fahrzeug wählen –</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.kennzeichen} – {v.marke} {v.modell}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Fahrzeug nicht dabei? Erst unter „Fahrzeuge → + Fahrzeug anlegen“ erfassen.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Titel *</label>
          <input
            required
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="z.B. Bremsen vorne erneuern"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Was muss gemacht werden? *
          </label>
          <textarea
            required
            rows={4}
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Zuweisen an</label>
            <select
              value={zugewiesenAnId}
              onChange={(e) => setZugewiesenAnId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">– Noch nicht zuweisen –</option>
              {mitarbeiter.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priorität</label>
            <select
              value={prioritaet}
              onChange={(e) => setPrioritaet(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value={1}>Hoch</option>
              <option value={2}>Normal</option>
              <option value={3}>Niedrig</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fällig am</label>
          <input
            type="date"
            value={faelligAm}
            onChange={(e) => setFaelligAm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <hr className="my-1 border-slate-200" />
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Benötigte Ersatzteile & Lagerplatz
            </label>
            <button
              type="button"
              onClick={addErsatzteil}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              + Teil hinzufügen
            </button>
          </div>
          {ersatzteile.length === 0 && (
            <p className="text-sm text-slate-400">Noch keine Ersatzteile hinzugefügt.</p>
          )}
          <div className="grid gap-2">
            {ersatzteile.map((teil, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_80px_auto] gap-2">
                <input
                  placeholder="Bezeichnung"
                  value={teil.bezeichnung}
                  onChange={(e) => updateErsatzteil(i, "bezeichnung", e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  placeholder="Lagerplatz (z.B. Regal A3)"
                  value={teil.lagerplatz}
                  onChange={(e) => updateErsatzteil(i, "lagerplatz", e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  type="number"
                  min={1}
                  value={teil.menge}
                  onChange={(e) => updateErsatzteil(i, "menge", Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  onClick={() => removeErsatzteil(i)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Speichern…" : "Auftrag anlegen"}
        </button>
      </form>
    </div>
  );
}

export default function NeuerAuftragPage() {
  return (
    <Suspense>
      <NeuerAuftragForm />
    </Suspense>
  );
}
