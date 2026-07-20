import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE ?? "LHMF1218ENGSERV2026";

export async function POST(req: NextRequest) {
  // Proteção simples: só permite se passar o código de gerência
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${MANAGEMENT_CODE}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@engeserv.com.br";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador Master";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    return NextResponse.json(
      { error: "SEED_ADMIN_PASSWORD não definido nas env vars" },
      { status: 500 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role }, message: "Admin já existe" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: { name, email, passwordHash, role: "ADMIN_MASTER", active: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user: admin, message: "Administrador Master criado com sucesso" }, { status: 201 });
  } catch (error) {
    console.error("[SEED_ADMIN_ERROR]", error);
    return NextResponse.json({ error: "Erro ao criar admin" }, { status: 500 });
  }
}