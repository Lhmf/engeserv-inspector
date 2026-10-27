import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Mesma ficha técnica aceita no PUT [id] — o formulário de cadastro envia
// todos os campos e o equipamento deve nascer completo.
const createEquipmentSchema = z.object({
  clientId: z.string().cuid("Cliente inválido."),
  tag: z.string().min(1, "TAG é obrigatória."),
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
  ]),
  description: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  manufactureYear: z.number().int().positive().optional().nullable(),
  designPressureBar: z.number().optional().nullable(),
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
  lengthMm: z.number().positive().optional().nullable(),
  insideDiameterMm: z.number().positive().optional().nullable(),
  orientation: z.string().optional().nullable(),
  jointType: z.string().optional().nullable(),
  installationLocation: z.string().optional().nullable(),
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
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get("clientId");

  const equipamentos = await prisma.equipment.findMany({
    where: clientId ? { clientId } : undefined,
    include: {
      client: { select: { id: true, companyName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ equipamentos });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createEquipmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { clientId, ...data } = parsed.data;

  // Verifica se cliente existe e está ativo
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, active: true },
  });
  if (!client || !client.active) {
    return NextResponse.json({ error: "Cliente inválido ou inativo." }, { status: 400 });
  }

  // Verifica TAG única no mesmo cliente
  const existing = await prisma.equipment.findUnique({
    where: { clientId_tag: { clientId, tag: data.tag } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Já existe equipamento com esta TAG neste cliente." },
      { status: 409 }
    );
  }

  const equipamento = await prisma.equipment.create({
    data: {
      clientId,
      ...data,
    },
    include: {
      client: { select: { id: true, companyName: true } },
    },
  });

  return NextResponse.json({ equipamento }, { status: 201 });
}
