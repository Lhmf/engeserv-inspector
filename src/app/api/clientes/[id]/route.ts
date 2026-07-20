import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const clienteUpdateSchema = z.object({
  companyName: z.string().min(2, "Informe a razão social.").optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Email inválido.").optional(),
  responsibleId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

// GET /api/clientes/[id] -> busca cliente por ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const cliente = await prisma.client.findUnique({
    where: { id },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      equipments: {
        include: { _count: { select: { inspections: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ cliente });
}

// PUT /api/clientes/[id] -> atualiza cliente
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = clienteUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { companyName, cnpj, address, contactName, contactPhone, contactEmail, responsibleId, active } = parsed.data;

  // Verifica se cliente existe
  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  // Validações
  if (cnpj !== undefined && cnpj && cnpj.replace(/\D/g, "").length !== 14) {
    return NextResponse.json({ error: "CNPJ deve ter 14 dígitos." }, { status: 400 });
  }
  if (contactEmail && !contactEmail.includes("@")) {
    return NextResponse.json({ error: "Email de contato inválido." }, { status: 400 });
  }
  if (responsibleId) {
    const responsible = await prisma.user.findUnique({
      where: { id: responsibleId },
      select: { id: true, role: true, active: true },
    });
    if (!responsible || responsible.role !== "GESTOR" || !responsible.active) {
      return NextResponse.json(
        { error: "Responsável deve ser um Gestor ativo." },
        { status: 400 }
      );
    }
  }

  const cliente = await prisma.client.update({
    where: { id },
    data: {
      companyName,
      cnpj: cnpj ? cnpj.replace(/\D/g, "") : null,
      address,
      contactName,
      contactPhone,
      contactEmail,
      responsibleId: responsibleId ?? null,
      active,
    },
    include: {
      responsible: { select: { id: true, name: true, email: true } },
      _count: { select: { equipments: true } },
    },
  });

  return NextResponse.json({ cliente });
}

// DELETE /api/clientes/[id] -> desativa cliente (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.client.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  // Verifica se tem equipamentos ativos
  const equipments = await prisma.equipment.findMany({
    where: { clientId: id, active: true },
    select: { id: true },
  });

  if (equipments.length > 0) {
    return NextResponse.json(
      { error: "Cliente possui equipamentos ativos. Desative-os primeiro." },
      { status: 400 }
    );
  }

  await prisma.client.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ message: "Cliente desativado com sucesso." });
}