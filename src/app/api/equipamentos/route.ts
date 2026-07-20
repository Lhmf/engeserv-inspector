import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  manufactureYear: z.number().int().positive().optional(),
  designPressureBar: z.number().positive().optional(),
  originalThicknessMm: z.number().positive().optional(),
  minThicknessMm: z.number().positive().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const equipamentos = await prisma.equipment.findMany({
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

  const { clientId, tag, type, description, manufacturer, manufactureYear, designPressureBar, originalThicknessMm, minThicknessMm } = parsed.data;

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
    where: { clientId_tag: { clientId, tag } },
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
      tag,
      type,
      description,
      manufacturer,
      manufactureYear,
      designPressureBar,
      originalThicknessMm,
      minThicknessMm,
    },
    include: {
      client: { select: { id: true, companyName: true } },
    },
  });

  return NextResponse.json({ equipamento }, { status: 201 });
}