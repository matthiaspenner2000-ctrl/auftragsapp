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
(NPM) läuft bereits als eigener Stack und terminiert HTTPS für andere Domains. Weder
SSH noch FTP-Zugriff auf den Dockge-Stack-Ordner werden benötigt – das fertige
Docker-Image wird automatisch per GitHub Actions gebaut und nach GitHub Container
Registry (ghcr.io) veröffentlicht. In Dockge muss nur noch fertiger Compose-Text
eingefügt werden.

### 1. GitHub Actions Build abwarten

Bei jedem Push nach `main` baut GitHub Actions automatisch das Docker-Image und
veröffentlicht es unter `ghcr.io/matthiaspenner2000-ctrl/auftragsapp:latest`
(Fortschritt im **Actions**-Tab des Repos:
https://github.com/matthiaspenner2000-ctrl/auftragsapp/actions).

Nach dem ersten erfolgreichen Build: Auf github.com → dein Profil → **Packages** →
`auftragsapp` öffnen → **Package settings** → Sichtbarkeit auf **Public** stellen
(sonst braucht der Server einen Docker-Login, um das Image zu ziehen).

### 2. Neuen Stack in Dockge anlegen

Dockge → **+ Compose** → Name z.B. `auftragsapp`.

### 3. Fertigen Compose-Inhalt einfügen

Den Inhalt aus [`docker-compose.dockge.example.yml`](docker-compose.dockge.example.yml)
kopieren, alle `CHANGE_ME_*`-Platzhalter durch echte, starke Werte ersetzen (Vorschläge
weiter unten), und das Ergebnis in Dockges Compose-Editor einfügen und speichern.

> Diese Datei ist absichtlich **nicht** die im Repo verwendete `docker-compose.yml` –
> sie referenziert das fertige `image:` statt `build: .` und enthält direkt die
> Secrets, weil Dockge hier keine separate `.env`-Datei anbietet. Diese ausgefüllte
> Version bleibt nur in Dockge gespeichert, sie wird nie nach GitHub gepusht.

### 4. Stack starten

In Dockge auf den `auftragsapp`-Stack gehen → **Deploy** (zieht das fertige Image
von ghcr.io und startet alle Container: `postgres`, `minio`, `minio-init`,
`auftragsapp-web`). Die Datenbank-Migrationen (`prisma migrate deploy`) laufen
automatisch beim Start des `auftragsapp-web`-Containers.

> Der Servicename `auftragsapp-web` ist bewusst spezifisch gewählt (nicht z.B. `app`),
> weil auf dem gemeinsamen `npm`-Docker-Netzwerk auch andere Stacks laufen können –
> ein generischer Name wie `app` kann dort mit einem gleichnamigen Service aus einem
> anderen Stack kollidieren, wodurch Nginx Proxy Manager Anfragen an den falschen
> Container weiterleitet.

### 5. Ersten Admin-Account anlegen

In Dockge beim `auftragsapp`-Stack das eingebaute **Terminal** für den
`auftragsapp-web`-Container öffnen und ausführen (Werte an die eigenen
`SEED_ADMIN_*`-Wünsche anpassen, sonst wird `admin@mp-digitalagentur.de` /
`changeme123` angelegt):

```bash
npm run db:seed
```

### 6. Proxy Host in Nginx Proxy Manager anlegen

In der NPM-Weboberfläche → **Proxy Hosts** → **Add Proxy Host**:

- Domain Names: `auftragsapp.mp-digitalagentur.de`
- Scheme: `http`
- Forward Hostname/IP: `auftragsapp-web` (Name des Docker-Compose-Service)
- Forward Port: `3000`
- SSL-Tab: **Request a new SSL Certificate** (Let's Encrypt) aktivieren + Force SSL

Voraussetzung: Der DNS-A-Record von `auftragsapp.mp-digitalagentur.de` zeigt bereits
auf die Server-IP.

Danach unter `https://auftragsapp.mp-digitalagentur.de/login` anmelden (Standard, falls
keine `SEED_ADMIN_*`-Werte gesetzt wurden: `admin@mp-digitalagentur.de` / `changeme123` –
Passwort danach unbedingt ändern). Über **Mitarbeiter** (nur als Admin sichtbar) können
weitere Konten angelegt werden.

### Updates einspielen

1. Code-Änderungen nach GitHub pushen (`git push`) → GitHub Actions baut automatisch
   ein neues Image und veröffentlicht es unter `:latest`.
2. In Dockge beim `auftragsapp`-Stack auf **Pull** (neues Image holen) und danach
   **Deploy**/**Restart** klicken, damit die Container das neue Image verwenden.

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
- `docker-compose.yml`, `Dockerfile` – für lokales Docker-basiertes Testen (baut das
  Image selbst, `${VAR}`-Platzhalter aus `.env`)
- `docker-compose.dockge.example.yml` – Vorlage für den Dockge-Compose-Editor auf dem
  Server (nutzt das fertige GHCR-Image statt eigenem Build)
- `.github/workflows/docker-publish.yml` – baut bei jedem Push nach `main` automatisch
  das Docker-Image und veröffentlicht es nach ghcr.io
