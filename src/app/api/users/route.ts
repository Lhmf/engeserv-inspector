import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, canCreateGestor, canCreateFuncionario } from "@/lib/auth";

const createUserSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  email: z.string().email("Informe um email valido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  role: z.enum(["GESTOR", "FUNCIONARIO"]),
});

// GET /api/users -> lista usuarios (qualquer usuario autenticado pode ver)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST /api/users -> cria Gestor (somente Admin Master) ou Funcionario (Admin Master ou Gestor)
// Regra do PROJECT_RULES.md: "Somente ele [Admin Master] consegue criar gestores."
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;

  if (role === "GESTOR" && !canCreateGestor(session.role)) {
    return NextResponse.json(
      { error: "Apenas o Administrador Master pode criar contas de Gestor." },
      { status: 403 }
    );
  }

  if (role === "FUNCIONARIO" && !canCreateFuncionario(session.role)) {
    return NextResponse.json(
      { error: "Apenas Administrador Master ou Gestor podem criar contas de Funcionario." },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ja existe um usuario com este email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, createdById: session.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
