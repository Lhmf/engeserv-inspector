import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Este script cria a UNICA conta de Administrador Master do sistema,
// conforme decidido no PROJECT_RULES.md: "Somente ele consegue criar
// gestores". Depois de rodar uma vez, o codigo de gerencia deixa de
// aparecer em qualquer tela do sistema.

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@engeserv.com.br";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador Master";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const managementCode = process.env.MANAGEMENT_CODE;

  if (!password) {
    throw new Error(
      "Defina SEED_ADMIN_PASSWORD no arquivo .env antes de rodar o seed."
    );
  }
  if (!managementCode) {
    throw new Error("Defina MANAGEMENT_CODE no arquivo .env antes de rodar o seed.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuario ${email} ja existe. Nada a fazer.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN_MASTER",
    },
  });

  console.log("Administrador Master criado com sucesso:");
  console.log(`  Nome:  ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log("Use esse email e a senha definida em SEED_ADMIN_PASSWORD para logar.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
