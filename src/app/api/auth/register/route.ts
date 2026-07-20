import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  phone: z.string().min(10, "Informe um telefone válido com DDD."),
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
  managementCode: z.string().optional(),
});

const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE ?? "LHMF1218ENGSERV2026";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { name, phone, email, password, managementCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
  }

  const isManager = managementCode && managementCode === MANAGEMENT_CODE;
  const role = isManager ? "GESTOR" : "FUNCIONARIO";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      passwordHash,
      role,
      active: true,
    },
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    role,
  });
}