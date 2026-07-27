import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Password padrão para todos os usuários de desenvolvimento
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? "demo123456";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. ADMIN_MASTER - Administrador Master
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@engeserv.com.br";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "ADMIN_MASTER",
        active: true,
      },
    });
    console.log("✅ ADMIN_MASTER criado:");
    console.log(`   Nome:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Senha: ${defaultPassword}`);
  } else {
    // Atualizar role se necessário
    if (existingAdmin.role !== "ADMIN_MASTER") {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMIN_MASTER", active: true },
      });
      console.log(`✅ ADMIN_MASTER atualizado: ${adminEmail}`);
    } else {
      console.log(`ℹ️ ADMIN_MASTER já existe: ${adminEmail}`);
    }
  }

  // 2. GESTOR - Gestor Demo
  const gestorEmail = process.env.SEED_GESTOR_EMAIL ?? "gestor@engeserv.com.br";
  const gestorName = process.env.SEED_GESTOR_NAME ?? "Gestor Demo";

  const existingGestor = await prisma.user.findUnique({ where: { email: gestorEmail } });
  if (!existingGestor) {
    const gestor = await prisma.user.create({
      data: {
        name: gestorName,
        email: gestorEmail,
        passwordHash,
        role: "GESTOR",
        active: true,
      },
    });
    console.log("✅ GESTOR criado:");
    console.log(`   Nome:  ${gestor.name}`);
    console.log(`   Email: ${gestor.email}`);
    console.log(`   Senha: ${defaultPassword}`);
  } else {
    // Atualizar role se necessário
    if (existingGestor.role !== "GESTOR") {
      await prisma.user.update({
        where: { email: gestorEmail },
        data: { role: "GESTOR", active: true },
      });
      console.log(`✅ GESTOR atualizado: ${gestorEmail}`);
    } else {
      console.log(`ℹ️ GESTOR já existe: ${gestorEmail}`);
    }
  }

  // 3. FUNCIONARIO - Usuário Demo
  const funcionarioEmail = process.env.SEED_FUNCIONARIO_EMAIL ?? "demo@engeserv.com.br";
  const funcionarioName = process.env.SEED_FUNCIONARIO_NAME ?? "Usuário Demo";

  const existingFuncionario = await prisma.user.findUnique({ where: { email: funcionarioEmail } });
  if (!existingFuncionario) {
    const funcionario = await prisma.user.create({
      data: {
        name: funcionarioName,
        email: funcionarioEmail,
        passwordHash,
        role: "FUNCIONARIO",
        active: true,
      },
    });
    console.log("✅ FUNCIONARIO criado:");
    console.log(`   Nome:  ${funcionario.name}`);
    console.log(`   Email: ${funcionario.email}`);
    console.log(`   Senha: ${defaultPassword}`);
  } else {
    // Atualizar role se necessário
    if (existingFuncionario.role !== "FUNCIONARIO") {
      await prisma.user.update({
        where: { email: funcionarioEmail },
        data: { role: "FUNCIONARIO", active: true },
      });
      console.log(`✅ FUNCIONARIO atualizado: ${funcionarioEmail}`);
    } else {
      console.log(`ℹ️ FUNCIONARIO já existe: ${funcionarioEmail}`);
    }
  }

  // Resumo final
  console.log("\n========================================");
  console.log("🎉 Seed concluído com sucesso!");
  console.log("========================================");
  console.log("\n📋 Credenciais para login:");
  console.log(`   ADMIN_MASTER:  ${adminEmail}    / ${defaultPassword}`);
  console.log(`   GESTOR:        ${gestorEmail}   / ${defaultPassword}`);
  console.log(`   FUNCIONARIO:   ${funcionarioEmail} / ${defaultPassword}`);
  console.log("\n⚠️  Use a senha padrão 'demo123456' ou defina SEED_DEFAULT_PASSWORD no .env");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });