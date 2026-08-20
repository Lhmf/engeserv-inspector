import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateEquipmentSchema = z.object({
  tag: z.string().min(1, "TAG é obrigatória.").optional(),
  type: z.enum([
    "CALDEIRA",
    "VASO_DE_PRESSAO",
    "SILO",
    "TANQUE",
    "TUBULACAO",
    "COMPRESSOR",
    "TROCADOR_DE_CALOR",
    "REATOR",
    "OUTRO",
  ]).optional(),
  description: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  manufactureYear: z.number().int().positive().optional().nullable(),
  designPressureBar: z.number().positive().optional().nullable(),
  originalThicknessMm: z.number().positive().optional().nullable(),
  minThicknessMm: z.number().positive().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  designCode: z.string().optional().nullable(),
  designTempC: z.number().optional().nullable(),
  operatingPressureBar: z.number().optional().nullable(),
  operatingTempC: z.number().optional().nullable(),
  mawpBar: z.number().optional().nullable(),
  hydroTestPressureBar: z.number().optional().nullable(),
  headType: z.string().optional().nullable(),
  headMaterial: z.string().optional().nullable(),
  bodyMaterial: z.string().optional().nullable(),
  headNominalThicknessMm: z.number().optional().nullable(),
  volumeLiters: z.number().optional().nullable(),
  jointEfficiency: z.number().optional().nullable(),
  corrosionAllowanceMm: z.number().optional().nullable(),
  fluidType: z.string().optional().nullable(),
  fluidClass: z.string().optional().nullable(),
  riskGroup: z.number().int().optional().nullable(),
  nr13Category: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const equipamento = await prisma.equipment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, companyName: true } },
    },
  });

  if (!equipamento) {
    return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ equipamento });
}

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
  const parsed = updateEquipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const existing = await prisma.equipment.findUnique({
    where: { id },
    select: { id: true, clientId: true, tag: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
  }

  // Se está mudando a tag, verifica unicidade no mesmo cliente
  if (parsed.data.tag && parsed.data.tag !== existing.tag) {
    const conflict = await prisma.equipment.findUnique({
      where: { clientId_tag: { clientId: existing.clientId, tag: parsed.data.tag } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Já existe equipamento com esta TAG neste cliente." },
        { status: 409 }
      );
    }
  }

  const equipamento = await prisma.equipment.update({
    where: { id },
    data: parsed.data,
    include: {
      client: { select: { id: true, companyName: true } },
    },
  });

  return NextResponse.json({ equipamento });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.equipment.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Equipamento não encontrado." }, { status: 404 });
  }

  await prisma.equipment.delete({ where: { id } });

  return NextResponse.json({ message: "Equipamento excluído com sucesso." });
}