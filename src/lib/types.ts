export type Role = "ADMIN" | "MITARBEITER";
export type AuftragStatus = "OFFEN" | "IN_ARBEIT" | "WARTET_AUF_TEILE" | "ERLEDIGT";
export type DateiTyp = "RECHNUNG" | "FOTO" | "DOKUMENT";

export const STATUS_LABELS: Record<AuftragStatus, string> = {
  OFFEN: "Offen",
  IN_ARBEIT: "In Arbeit",
  WARTET_AUF_TEILE: "Wartet auf Teile",
  ERLEDIGT: "Erledigt",
};

export const STATUS_COLORS: Record<AuftragStatus, string> = {
  OFFEN: "bg-slate-200 text-slate-700",
  IN_ARBEIT: "bg-sky-100 text-sky-700",
  WARTET_AUF_TEILE: "bg-amber-100 text-amber-800",
  ERLEDIGT: "bg-emerald-100 text-emerald-700",
};

export const PRIORITAET_LABELS: Record<number, string> = {
  1: "Hoch",
  2: "Normal",
  3: "Niedrig",
};

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  _count?: { zugewieseneAuftraege: number };
};

export type Vehicle = {
  id: string;
  kennzeichen: string;
  marke: string;
  modell: string;
  baujahr: number | null;
  vin: string | null;
  farbe: string | null;
  kilometerstand: number | null;
  kundeName: string | null;
  kundeTelefon: string | null;
  kundeEmail: string | null;
  notizen: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { auftraege: number };
};

export type Ersatzteil = {
  id: string;
  bezeichnung: string;
  lagerplatz: string;
  menge: number;
  bestellt: boolean;
};

export type AuftragDatei = {
  id: string;
  typ: DateiTyp;
  dateiname: string;
  mimeType: string;
  groesse: number;
  createdAt: string;
  hochgeladenVon: { id: string; name: string };
};

export type AuftragKommentar = {
  id: string;
  text: string;
  createdAt: string;
  autor: { id: string; name: string };
};

export type AuftragSummary = {
  id: string;
  titel: string;
  beschreibung: string;
  status: AuftragStatus;
  prioritaet: number;
  faelligAm: string | null;
  createdAt: string;
  vehicle: Vehicle;
  zugewiesenAn: { id: string; name: string } | null;
  erstelltVon: { id: string; name: string };
  _count?: { dateien: number; ersatzteile: number };
};

export type AuftragDetail = AuftragSummary & {
  ersatzteile: Ersatzteil[];
  dateien: AuftragDatei[];
  kommentare: AuftragKommentar[];
};

export type VehicleDetail = Vehicle & {
  auftraege: AuftragSummary[];
};
