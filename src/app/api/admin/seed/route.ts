import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE ?? "LHMF1218ENGSERV2026";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const providedCode = authHeader?.replace("Bearer ", "");

  if (providedCode !== MANAGEMENT_CODE) {
    return NextResponse.json({ error: "Código de gerência inválido" }, { status: 403 });
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@engeserv.com.br";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador Master";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    return NextResponse.json({ error: "SEED_ADMIN_PASSWORD não definido" }, { status: 500 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: { email },
      create: {
        name,
        email,
        passwordHash,
        role: "ADMIN_MASTER",
        active: true,
      },
      update: {
        passwordHash,
        name,
        role: "ADMIN_MASTER",
        active: true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user: admin, message: "Administrador Master sincronizado com sucesso" });
  } catch (error) {
    console.error("[SEED_ADMIN_ERROR]", error);
    return NextResponse.json({ error: "Erro ao sincronizar admin" }, { status: 500 });
  }
}