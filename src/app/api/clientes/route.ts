import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const clientSchema = z.object({
  companyName: z.string().min(2, "Razão social é obrigatória."),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Email inválido.").optional().or(z.literal("")),
  responsibleId: z.string().cuid("Responsável inválido.").optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const clientes = await prisma.client.findMany({
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      _count: { select: { equipments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clientes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { companyName, cnpj, address, contactName, contactPhone, contactEmail, responsibleId } = parsed.data;

  // Verifica CNPJ duplicado
  if (cnpj) {
    const existing = await prisma.client.findUnique({ where: { cnpj } });
    if (existing) {
      return NextResponse.json({ error: "Já existe cliente com este CNPJ." }, { status: 409 });
    }
  }

  // Verifica responsável válido (deve ser GESTOR ativo)
  if (responsibleId) {
    const responsible = await prisma.user.findUnique({
      where: { id: responsibleId },
      select: { id: true, role: true, active: true },
    });
    if (!responsible || responsible.role !== "GESTOR" || !responsible.active) {
      return NextResponse.json({ error: "Responsável deve ser um Gestor ativo." }, { status: 400 });
    }
  }

  const cliente = await prisma.client.create({
    data: {
      companyName,
      cnpj,
      address,
      contactName,
      contactPhone,
      contactEmail,
      responsibleId,
    },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      _count: { select: { equipments: true } },
    },
  });

  return NextResponse.json({ cliente }, { status: 201 });
}