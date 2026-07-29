import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos

// Rate limiter simples em memória (Map<IP, {count, resetAt}>)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Cleanup do rate limit a cada 30 min (remove entradas expiradas)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, 30 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  // 2. Autenticação via MANAGEMENT_CODE (APENAS via env, sem fallback)
  if (!MANAGEMENT_CODE) {
    return NextResponse.json({ error: "MANAGEMENT_CODE não configurado no servidor." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization");
  const providedCode = authHeader?.replace("Bearer ", "");

  if (providedCode !== MANAGEMENT_CODE) {
    return NextResponse.json({ error: "Código de gerência inválido" }, { status: 403 });
  }

  // 3. Criação do usuário
  try {
    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    const validRoles = ["ADMIN_MASTER", "GESTOR", "FUNCIONARIO"];
    const finalRole = role ?? "ADMIN_MASTER";
    if (!validRoles.includes(finalRole)) {
      return NextResponse.json({ error: `Papel inválido. Use: ${validRoles.join(", ")}` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        name: name ?? email.split("@")[0],
        email,
        passwordHash,
        role: finalRole as any,
        active: true,
      },
      update: {
        passwordHash,
        name: name ?? email.split("@")[0],
        role: finalRole as any,
        active: true,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user, message: "Usuário criado/atualizado com sucesso" });
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 });
  }
}
