"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NeuesFahrzeugPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [kbaStatus, setKbaStatus] = useState<
    { state: "idle" } | { state: "loading" } | { state: "found" } | { state: "not-found" }
  >({ state: "idle" });

  const [form, setForm] = useState({
    kennzeichen: "",
    marke: "",
    modell: "",
    hsn: "",
    tsn: "",
    baujahr: "",
    vin: "",
    farbe: "",
    kilometerstand: "",
    kundeName: "",
    kundeTelefon: "",
    kundeEmail: "",
    notizen: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const hsn = form.hsn.trim();
  const tsn = form.tsn.trim();

  useEffect(() => {
    if (hsn.length !== 4 || tsn.length !== 3) {
      setKbaStatus({ state: "idle" });
      return;
    }

    let cancelled = false;
    setKbaStatus({ state: "loading" });

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/kba/lookup?hsn=${hsn}&tsn=${tsn}`);
      if (cancelled) return;

      if (!res.ok) {
        setKbaStatus({ state: "not-found" });
        return;
      }

      const data = await res.json();
      setForm((f) => ({ ...f, marke: data.hersteller, modell: data.handelsname }));
      setKbaStatus({ state: "found" });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [hsn, tsn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kennzeichen: form.kennzeichen,
        marke: form.marke,
        modell: form.modell,
        hsn: form.hsn || null,
        tsn: form.tsn || null,
        baujahr: form.baujahr ? Number(form.baujahr) : null,
        vin: form.vin || null,
        farbe: form.farbe || null,
        kilometerstand: form.kilometerstand ? Number(form.kilometerstand) : null,
        kundeName: form.kundeName || null,
        kundeTelefon: form.kundeTelefon || null,
        kundeEmail: form.kundeEmail || null,
        notizen: form.notizen || null,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Fehler beim Anlegen");
      return;
    }

    const vehicle = await res.json();
    router.push(`/fahrzeuge/${vehicle.id}`);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Neues Fahrzeug</h1>
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="grid grid-cols-[100px_100px_1fr] gap-4">
            <Field
              label="HSN"
              value={form.hsn}
              onChange={(v) => update("hsn", v.toUpperCase())}
              maxLength={4}
              placeholder="0588"
            />
            <Field
              label="TSN"
              value={form.tsn}
              onChange={(v) => update("tsn", v.toUpperCase())}
              maxLength={3}
              placeholder="AGI"
            />
            <div className="flex items-end pb-2 text-sm">
              {kbaStatus.state === "loading" && <span className="text-slate-400">Suche…</span>}
              {kbaStatus.state === "found" && (
                <span className="text-emerald-600">
                  ✓ Erkannt: {form.marke} {form.modell}
                </span>
              )}
              {kbaStatus.state === "not-found" && (
                <span className="text-amber-600">Keine KBA-Daten gefunden – bitte manuell eintragen.</span>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Herstellerschlüssel- und Typschlüsselnummer aus dem Fahrzeugschein (Feld 2.1/2.2) – Marke
            &amp; Modell werden automatisch ausgefüllt.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Kennzeichen *" value={form.kennzeichen} onChange={(v) => update("kennzeichen", v)} required />
          <Field label="Baujahr" value={form.baujahr} onChange={(v) => update("baujahr", v)} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Marke *" value={form.marke} onChange={(v) => update("marke", v)} required />
          <Field label="Modell *" value={form.modell} onChange={(v) => update("modell", v)} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Farbe" value={form.farbe} onChange={(v) => update("farbe", v)} />
          <Field label="Kilometerstand" value={form.kilometerstand} onChange={(v) => update("kilometerstand", v)} type="number" />
        </div>
        <Field label="Fahrgestellnummer (VIN)" value={form.vin} onChange={(v) => update("vin", v)} />

        <hr className="my-2 border-slate-200" />
        <p className="text-sm font-medium text-slate-700">Kundendaten (optional)</p>
        <Field label="Kundenname" value={form.kundeName} onChange={(v) => update("kundeName", v)} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefon" value={form.kundeTelefon} onChange={(v) => update("kundeTelefon", v)} />
          <Field label="E-Mail" value={form.kundeEmail} onChange={(v) => update("kundeEmail", v)} type="email" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notizen</label>
          <textarea
            value={form.notizen}
            onChange={(e) => update("notizen", e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Speichern…" : "Fahrzeug anlegen"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}
