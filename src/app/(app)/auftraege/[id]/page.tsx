"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { AuftragDetail, DateiTyp, UserSummary } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, PRIORITAET_LABELS } from "@/lib/types";

const DATEI_TYP_LABELS: Record<DateiTyp, string> = {
  RECHNUNG: "Rechnung",
  FOTO: "Foto",
  DOKUMENT: "Dokument",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AuftragDetailPage() {
  const params = useParams<{ id: string }>();
  const [auftrag, setAuftrag] = useState<AuftragDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ userId: string; role: string } | null>(null);
  const [mitarbeiter, setMitarbeiter] = useState<UserSummary[]>([]);
  const [kommentarText, setKommentarText] = useState("");
  const [uploadTyp, setUploadTyp] = useState<DateiTyp>("FOTO");
  const [uploading, setUploading] = useState(false);
  const [neuTeil, setNeuTeil] = useState({ bezeichnung: "", lagerplatz: "", menge: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = session?.role === "ADMIN";

  async function load() {
    const res = await fetch(`/api/auftraege/${params.id}`);
    if (res.ok) setAuftrag(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialer Datenabruf beim Mount/Routenwechsel
    load();
    fetch("/api/session").then((r) => r.json()).then(setSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load() ist stabil und hängt nur an params.id
  }, [params.id]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users").then((r) => r.json()).then((users: UserSummary[]) =>
        setMitarbeiter(users.filter((u) => u.active))
      );
    }
  }, [isAdmin]);

  async function updateAuftrag(data: Record<string, unknown>) {
    await fetch(`/api/auftraege/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function handleKommentarSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kommentarText.trim()) return;
    await fetch(`/api/auftraege/${params.id}/kommentare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: kommentarText }),
    });
    setKommentarText("");
    load();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("typ", uploadTyp);
    await fetch(`/api/auftraege/${params.id}/dateien`, { method: "POST", body: formData });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  async function handleDownload(dateiId: string) {
    const res = await fetch(`/api/auftraege/${params.id}/dateien/${dateiId}`);
    if (!res.ok) return;
    const { url } = await res.json();
    window.open(url, "_blank");
  }

  async function handleDeleteDatei(dateiId: string) {
    if (!confirm("Datei wirklich löschen?")) return;
    await fetch(`/api/auftraege/${params.id}/dateien/${dateiId}`, { method: "DELETE" });
    load();
  }

  async function handleAddTeil(e: React.FormEvent) {
    e.preventDefault();
    if (!neuTeil.bezeichnung || !neuTeil.lagerplatz) return;
    await fetch(`/api/auftraege/${params.id}/ersatzteile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(neuTeil),
    });
    setNeuTeil({ bezeichnung: "", lagerplatz: "", menge: 1 });
    load();
  }

  async function toggleBestellt(ersatzteilId: string, bestellt: boolean) {
    await fetch(`/api/auftraege/${params.id}/ersatzteile/${ersatzteilId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bestellt }),
    });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">Lädt…</p>;
  if (!auftrag) return <p className="text-sm text-slate-500">Auftrag nicht gefunden.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 grid gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{auftrag.titel}</h1>
              <Link
                href={`/fahrzeuge/${auftrag.vehicle.id}`}
                className="text-sm text-slate-500 hover:text-slate-900 hover:underline"
              >
                {auftrag.vehicle.kennzeichen} · {auftrag.vehicle.marke} {auftrag.vehicle.modell}
              </Link>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[auftrag.status]}`}>
              {STATUS_LABELS[auftrag.status]}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{auftrag.beschreibung}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>Priorität: {PRIORITAET_LABELS[auftrag.prioritaet]}</span>
            {auftrag.faelligAm && (
              <span>Fällig: {new Date(auftrag.faelligAm).toLocaleDateString("de-DE")}</span>
            )}
            <span>Erstellt von: {auftrag.erstelltVon.name}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={auftrag.status}
                onChange={(e) => updateAuftrag({ status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Zugewiesen an</label>
                <select
                  value={auftrag.zugewiesenAn?.id ?? ""}
                  onChange={(e) => updateAuftrag({ zugewiesenAnId: e.target.value || null })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">– Niemand –</option>
                  {mitarbeiter.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">
            Ersatzteile &amp; Lagerplätze
          </h2>
          {auftrag.ersatzteile.length === 0 ? (
            <p className="text-sm text-slate-400">Keine Ersatzteile hinterlegt.</p>
          ) : (
            <div className="mb-4 grid gap-2">
              {auftrag.ersatzteile.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-900">{t.bezeichnung}</span>{" "}
                    <span className="text-slate-500">× {t.menge}</span>
                    <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Lagerplatz: {t.lagerplatz}
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={t.bestellt}
                      onChange={(e) => toggleBestellt(t.id, e.target.checked)}
                    />
                    bestellt
                  </label>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddTeil} className="grid grid-cols-[1fr_1fr_70px_auto] gap-2">
            <input
              placeholder="Bezeichnung"
              value={neuTeil.bezeichnung}
              onChange={(e) => setNeuTeil((s) => ({ ...s, bezeichnung: e.target.value }))}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Lagerplatz"
              value={neuTeil.lagerplatz}
              onChange={(e) => setNeuTeil((s) => ({ ...s, lagerplatz: e.target.value }))}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={1}
              value={neuTeil.menge}
              onChange={(e) => setNeuTeil((s) => ({ ...s, menge: Number(e.target.value) }))}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
              + Hinzufügen
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Kommentare</h2>
          <div className="mb-4 grid gap-3">
            {auftrag.kommentare.map((k) => (
              <div key={k.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="mb-1 text-xs text-slate-500">
                  {k.autor.name} · {new Date(k.createdAt).toLocaleString("de-DE")}
                </p>
                <p className="whitespace-pre-wrap text-slate-800">{k.text}</p>
              </div>
            ))}
            {auftrag.kommentare.length === 0 && (
              <p className="text-sm text-slate-400">Noch keine Kommentare.</p>
            )}
          </div>
          <form onSubmit={handleKommentarSubmit} className="flex gap-2">
            <input
              value={kommentarText}
              onChange={(e) => setKommentarText(e.target.value)}
              placeholder="Kommentar hinzufügen…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Senden
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Dateien hochladen</h2>
          <div className="mb-3 flex gap-2">
            {(["RECHNUNG", "FOTO", "DOKUMENT"] as DateiTyp[]).map((typ) => (
              <button
                key={typ}
                type="button"
                onClick={() => setUploadTyp(typ)}
                className={`rounded-full px-3 py-1 text-xs ${
                  uploadTyp === typ
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {DATEI_TYP_LABELS[typ]}
              </button>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm"
          />
          {uploading && <p className="mt-2 text-xs text-slate-500">Lädt hoch…</p>}

          <div className="mt-4 grid gap-2">
            {auftrag.dateien.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{d.dateiname}</p>
                  <p className="text-xs text-slate-500">
                    {DATEI_TYP_LABELS[d.typ]} · {formatBytes(d.groesse)} · {d.hochgeladenVon.name}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleDownload(d.id)}
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    Öffnen
                  </button>
                  <button
                    onClick={() => handleDeleteDatei(d.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
            {auftrag.dateien.length === 0 && (
              <p className="text-sm text-slate-400">Noch keine Dateien hochgeladen.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
