-- Mitarbeiter sollen löschbar sein, ohne dass FK-Constraints das
-- verhindern. Referenzen auf gelöschte Nutzer werden stattdessen auf
-- NULL gesetzt (Auftrag/Datei/Kommentar bleiben erhalten).

-- DropForeignKey
ALTER TABLE "auftraege" DROP CONSTRAINT "auftraege_erstelltVonId_fkey";

-- AlterTable
ALTER TABLE "auftraege" ALTER COLUMN "erstelltVonId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "auftraege" ADD CONSTRAINT "auftraege_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "auftrag_dateien" DROP CONSTRAINT "auftrag_dateien_hochgeladenVonId_fkey";

-- AlterTable
ALTER TABLE "auftrag_dateien" ALTER COLUMN "hochgeladenVonId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "auftrag_dateien" ADD CONSTRAINT "auftrag_dateien_hochgeladenVonId_fkey" FOREIGN KEY ("hochgeladenVonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "auftrag_kommentare" DROP CONSTRAINT "auftrag_kommentare_autorId_fkey";

-- AlterTable
ALTER TABLE "auftrag_kommentare" ALTER COLUMN "autorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "auftrag_kommentare" ADD CONSTRAINT "auftrag_kommentare_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
