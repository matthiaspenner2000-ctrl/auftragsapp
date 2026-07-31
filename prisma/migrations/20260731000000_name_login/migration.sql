-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email";

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");
