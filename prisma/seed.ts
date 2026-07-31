import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    console.log(`Admin-Konto existiert bereits: ${name}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin-Konto erstellt: ${name}`);
  console.log(`Bitte das Passwort nach dem ersten Login ändern!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
