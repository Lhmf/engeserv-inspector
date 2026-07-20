import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const createClientSchema = z.object({
  companyName: z.string().min(2, "Informe a razão social."),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  responsibleId: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      address: true,
      contactName: true,
      contactPhone: true,
      contactEmail: true,
      responsible: { select: { id: true, name: true, email: true } },
      _count: { select: { equipments: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Qualquer usuário autenticado pode criar cliente
  const body = await req.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { companyName, cnpj, address, contactName, contactPhone, contactEmail, responsibleId } = parsed.data;

  // Valida se responsibleId pertence a um usuário ativo
  if (responsibleId) {
    const resp = await prisma.user.findUnique({ where: { id: responsibleId } });
    if (!resp || !resp.active) {
      return NextResponse.json({ error: "Responsável inválido." }, { status: 400 });
    }
  }

  const client = await prisma.client.create({
    data: {
      companyName,
      cnpj,
      address,
      contactName,
      contactPhone,
      contactEmail,
      responsibleId,
    },
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      address: true,
      contactName: true,
      contactPhone: true,
      contactEmail: true,
      responsible: { select: { id: true, name: true, email: true } },
      _count: { select: { equipments: true } },
      createdAt: true,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}