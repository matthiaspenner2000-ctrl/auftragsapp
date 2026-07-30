# AuftragsApp

Werkstatt-Auftragsverwaltung: Der Admin legt Mitarbeiter-Konten an und weist Aufträge
(Fahrzeug, Aufgabe, Ersatzteile inkl. Lagerplatz) zu. Zu jedem Auftrag können Rechnungen,
Fotos und Dokumente hochgeladen werden. Jedes Fahrzeug hat eine eigene Kartei mit voller
Auftragshistorie.

**Stack:** Next.js (TypeScript) · PostgreSQL · Prisma · MinIO (S3-kompatibler Objektspeicher) ·
Docker Compose (verwaltet über Dockge) · Nginx Proxy Manager (Reverse Proxy/HTTPS)

## Lokale Entwicklung

**Variante A – mit Docker** (empfohlen, entspricht der Produktivumgebung):
Postgres + MinIO per Docker starten, dann wie unten mit `npm install` / `migrate dev` / `npm run dev` fortfahren.

**Variante B – ohne Docker** (z.B. auf einem Rechner ohne Docker Desktop):
Das Projekt enthält zwei kleine Hilfsskripte, die eine Postgres-kompatible Datenbank
(`@electric-sql/pglite`) und einen S3-kompatiblen Speicher (`s3rver`) rein in Node.js
bereitstellen – ohne Installation:

```bash
npm install
npm run dev:db      # separates Terminal: startet Postgres-kompatiblen Server auf Port 5432
npm run dev:s3      # separates Terminal: startet S3-Mock auf Port 9000
```

Danach in einem dritten Terminal:

```bash
cp .env.example .env
# .env ausfüllen (Standardwerte passen bereits zu dev:db / dev:s3)

npx prisma migrate dev --name init
npm run db:seed        # legt den ersten Admin-Account an (SEED_ADMIN_* aus .env)
npm run dev
```

App läuft dann unter http://localhost:3000, Login mit den `SEED_ADMIN_*`-Zugangsdaten aus der `.env`.

> Hinweis: `dev:db`/`dev:s3` sind reine Entwicklungs-Hilfsmittel und nicht für Produktion
> gedacht – dort kommen echtes PostgreSQL und MinIO per Docker Compose zum Einsatz (s.u.).

## Deployment auf dem VPS mit Dockge + Nginx Proxy Manager

Dieses Setup geht davon aus: Dockge läuft bereits auf dem Server, und Nginx Proxy Manager
(NPM) läuft bereits als eigener Stack und terminiert HTTPS für andere Domains. Ein
SSH-Terminal wird **nicht** benötigt – alles läuft über die Dockge-Weboberfläche
(inkl. Datei-Upload und eingebautem Container-Terminal für den einmaligen Seed-Befehl).

### 1. Neuen Stack in Dockge anlegen

- Dockge → **+ Compose** → Name z.B. `auftragsapp` → Speichern (das legt den Ordner
  `/opt/stacks/auftragsapp/` bzw. den bei euch konfigurierten Stacks-Pfad an – das ist
  der Ordner, in den du alles hochlädst).

### 2. Projektdateien per FTP/SFTP hochladen

Den kompletten Inhalt dieses Ordners **1:1** in den neuen Stack-Ordner hochladen
(inkl. `Dockerfile`, `docker-compose.yml`, `prisma/`, `src/`, `package.json` usw.).
Nicht mit hochladen: `node_modules/`, `.next/`, `.env` (lokale Datei) – falls dein
FTP-Client versteckte/`node_modules`-Ordner mit anzeigt, diese weglassen, das spart
nur Zeit beim Upload und wird beim Build ohnehin neu erzeugt.

Das `docker-compose.yml` ist bereits auf euer Docker-Netzwerk `npm` eingestellt
(so heißt es laut eurem bestehenden Nginx-Proxy-Manager-Stack) – hier muss nichts
mehr angepasst werden.

### 3. `.env`-Datei anlegen

Im Stack-Ordner eine Datei `.env` anlegen (Inhalt aus `.env.production.example` kopieren,
per FTP hochladen oder in Dockge im Datei-Editor des Stacks neu erstellen) und mit
echten, starken Passwörtern/Secrets befüllen.

### 4. Stack starten

In Dockge auf den `auftragsapp`-Stack gehen → **Deploy** (baut das Image aus dem
Dockerfile und startet alle Container: `postgres`, `minio`, `minio-init`, `app`).
Die Datenbank-Migrationen (`prisma migrate deploy`) laufen automatisch beim Start
des `app`-Containers.

### 5. Ersten Admin-Account anlegen

In Dockge beim `auftragsapp`-Stack das eingebaute **Terminal** für den `app`-Container
öffnen und ausführen:

```bash
npm run db:seed
```

### 6. Proxy Host in Nginx Proxy Manager anlegen

In der NPM-Weboberfläche → **Proxy Hosts** → **Add Proxy Host**:

- Domain Names: `auftragsapp.mp-digitalagentur.de`
- Scheme: `http`
- Forward Hostname/IP: `app` (Name des Docker-Compose-Service)
- Forward Port: `3000`
- SSL-Tab: **Request a new SSL Certificate** (Let's Encrypt) aktivieren + Force SSL

Voraussetzung: Der DNS-A-Record von `auftragsapp.mp-digitalagentur.de` zeigt bereits
auf die Server-IP.

Danach unter `https://auftragsapp.mp-digitalagentur.de/login` mit den `SEED_ADMIN_*`-Daten
aus der `.env` anmelden. Über **Mitarbeiter** (nur als Admin sichtbar) können weitere
Konten angelegt werden.

### Updates einspielen

Geänderte Dateien per FTP in den Stack-Ordner hochladen, dann in Dockge beim Stack
auf **Deploy** klicken (baut das Image neu und startet die Container neu).

### Backups

- Datenbank: über das Dockge-Terminal des `postgres`-Containers:
  `pg_dump -U auftragsapp auftragsapp > backup.sql`
- Dateien: Docker-Volume `minio_data` sichern (enthält alle hochgeladenen
  Rechnungen/Fotos/Dokumente)

## Projektstruktur

- `src/app/(app)/` – geschützte Seiten (Aufträge, Fahrzeuge, Admin-Bereich)
- `src/app/api/` – REST-Endpunkte (Auth, Users, Vehicles, Aufträge, Dateien)
- `src/lib/` – Prisma-Client, Session/Auth, S3-Anbindung, geteilte Typen
- `prisma/schema.prisma` – Datenmodell
- `docker-compose.yml`, `Dockerfile` – Produktions-Deployment (ohne eigenen Reverse
  Proxy – dafür wird der vorhandene Nginx Proxy Manager genutzt)
