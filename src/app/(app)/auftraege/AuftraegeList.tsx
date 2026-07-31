"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AuftragSummary } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, PRIORITAET_LABELS } from "@/lib/types";

export default function AuftraegeList({ isAdmin }: { isAdmin: boolean }) {
  const [auftraege, setAuftraege] = useState<AuftragSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  async function load(status?: string) {
    setLoading(true);
    const url = status ? `/api/auftraege?status=${status}` : "/api/auftraege";
    const res = await fetch(url);
    if (res.ok) setAuftraege(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialer Datenabruf beim Mount
    load();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Aufträge</h1>
        {isAdmin && (
          <Link
            href="/admin/auftraege/neu"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            + Neuer Auftrag
          </Link>
        )}
      </div>

      <div className="mb-6 flex gap-2">
        {["", "OFFEN", "IN_ARBEIT", "WARTET_AUF_TEILE", "ERLEDIGT"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              load(s || undefined);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              statusFilter === s
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s ? STATUS_LABELS[s as keyof typeof STATUS_LABELS] : "Alle"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Lädt…</p>
      ) : auftraege.length === 0 ? (
        <p className="text-sm text-slate-500">Keine Aufträge gefunden.</p>
      ) : (
        <div className="grid gap-3">
          {auftraege.map((a) => (
            <Link
              key={a.id}
              href={`/auftraege/${a.id}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{a.titel}</p>
                  {a.prioritaet === 1 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {PRIORITAET_LABELS[1]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {a.vehicle.kennzeichen} · {a.vehicle.marke} {a.vehicle.modell} · Zugewiesen an:{" "}
                  {a.zugewiesenAn?.name ?? "Niemand"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[a.status]}`}>
                {STATUS_LABELS[a.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
