import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const inspectionSchema = z.object({
  equipmentId: z.string().cuid("Equipamento inválido."),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId");

  const where = equipmentId ? { equipmentId } : {};

  const inspections = await prisma.inspection.findMany({
    where,
    include: {
      equipment: { select: { id: true, tag: true, type: true, client: { select: { companyName: true } } } },
      inspector: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { photos: true, measurements: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ inspections });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = inspectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { equipmentId } = parsed.data;

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, active: true, tag: true, clientId: true },
  });

  if (!equipment || !equipment.active) {
    return NextResponse.json({ error: "Equipamento inválido ou inativo." }, { status: 400 });
  }

  const existing = await prisma.inspection.findFirst({
    where: { equipmentId, status: "EM_ANDAMENTO" },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma inspeção em andamento para este equipamento." },
      { status: 409 }
    );
  }

  const inspection = await prisma.inspection.create({
    data: {
      equipmentId,
      inspectorId: session.userId,
      status: "EM_ANDAMENTO",
    },
    include: {
      equipment: { select: { id: true, tag: true, type: true, client: { select: { companyName: true } } } },
      inspector: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ inspection }, { status: 201 });
}