-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MITARBEITER');

-- CreateEnum
CREATE TYPE "AuftragStatus" AS ENUM ('OFFEN', 'IN_ARBEIT', 'WARTET_AUF_TEILE', 'ERLEDIGT');

-- CreateEnum
CREATE TYPE "DateiTyp" AS ENUM ('RECHNUNG', 'FOTO', 'DOKUMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MITARBEITER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "kennzeichen" TEXT NOT NULL,
    "marke" TEXT NOT NULL,
    "modell" TEXT NOT NULL,
    "baujahr" INTEGER,
    "vin" TEXT,
    "farbe" TEXT,
    "kilometerstand" INTEGER,
    "kundeName" TEXT,
    "kundeTelefon" TEXT,
    "kundeEmail" TEXT,
    "notizen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auftraege" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT NOT NULL,
    "status" "AuftragStatus" NOT NULL DEFAULT 'OFFEN',
    "prioritaet" INTEGER NOT NULL DEFAULT 2,
    "faelligAm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "erstelltVonId" TEXT NOT NULL,
    "zugewiesenAnId" TEXT,

    CONSTRAINT "auftraege_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ersatzteile" (
    "id" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "lagerplatz" TEXT NOT NULL,
    "menge" INTEGER NOT NULL DEFAULT 1,
    "bestellt" BOOLEAN NOT NULL DEFAULT false,
    "auftragId" TEXT NOT NULL,

    CONSTRAINT "ersatzteile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auftrag_dateien" (
    "id" TEXT NOT NULL,
    "typ" "DateiTyp" NOT NULL,
    "dateiname" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "groesse" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auftragId" TEXT NOT NULL,
    "hochgeladenVonId" TEXT NOT NULL,

    CONSTRAINT "auftrag_dateien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auftrag_kommentare" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auftragId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "auftrag_kommentare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_kennzeichen_key" ON "vehicles"("kennzeichen");

-- AddForeignKey
ALTER TABLE "auftraege" ADD CONSTRAINT "auftraege_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auftraege" ADD CONSTRAINT "auftraege_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auftraege" ADD CONSTRAINT "auftraege_zugewiesenAnId_fkey" FOREIGN KEY ("zugewiesenAnId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ersatzteile" ADD CONSTRAINT "ersatzteile_auftragId_fkey" FOREIGN KEY ("auftragId") REFERENCES "auftraege"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auftrag_dateien" ADD CONSTRAINT "auftrag_dateien_auftragId_fkey" FOREIGN KEY ("auftragId") REFERENCES "auftraege"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auftrag_dateien" ADD CONSTRAINT "auftrag_dateien_hochgeladenVonId_fkey" FOREIGN KEY ("hochgeladenVonId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auftrag_kommentare" ADD CONSTRAINT "auftrag_kommentare_auftragId_fkey" FOREIGN KEY ("auftragId") REFERENCES "auftraege"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auftrag_kommentare" ADD CONSTRAINT "auftrag_kommentare_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

