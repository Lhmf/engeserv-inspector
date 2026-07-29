import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE;

export async function POST(req: NextRequest) {
  if (!MANAGEMENT_CODE) {
    return NextResponse.json({ error: "MANAGEMENT_CODE não configurado no servidor." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const providedCode = authHeader?.replace("Bearer ", "");

  if (providedCode !== MANAGEMENT_CODE) {
    return NextResponse.json({ error: "Código de gerência inválido" }, { status: 403 });
  }

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD ?? "demo123456";

  const users = [
    {
      email: process.env.SEED_ADMIN_EMAIL ?? "luizhmedeiro@gmail.com",
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      role: "ADMIN_MASTER",
    },
    {
      email: process.env.SEED_GESTOR_EMAIL ?? "gestor@engeserv.com.br",
      name: process.env.SEED_GESTOR_NAME ?? "Gestor Demo",
      role: "GESTOR",
    },
    {
      email: process.env.SEED_FUNCIONARIO_EMAIL ?? "demo@engeserv.com.br",
      name: process.env.SEED_FUNCIONARIO_NAME ?? "Usuário Demo",
      role: "FUNCIONARIO",
    },
  ];

  try {
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const results = [];

    for (const u of users) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        create: {
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role as any,
          active: true,
        },
        update: {
          passwordHash,
          name: u.name,
          role: u.role as any,
          active: true,
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      });
      results.push(user);
    }

    return NextResponse.json({ users: results, message: "Usuários padrão sincronizados com sucesso" });
  } catch (error) {
    console.error("[SEED_ADMIN_ERROR]", error);
    return NextResponse.json({ error: "Erro ao sincronizar usuários" }, { status: 500 });
  }
}