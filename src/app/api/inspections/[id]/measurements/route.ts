import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const measurementSchema = z.object({
  point: z.string().min(1, "Ponto é obrigatório"),
  thicknessMm: z.number().positive("Espessura deve ser positiva"),
  angleDeg: z.number().int().min(0).max(360).optional(),
  notes: z.string().optional(),
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

  const measurements = await prisma.inspectionMeasurement.findMany({
    where: { inspectionId: id },
    orderBy: { point: "asc" },
  });

  return NextResponse.json({ measurements });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = measurementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { point, thicknessMm, angleDeg, notes } = parsed.data;

  // Check inspection exists and user has permission
  const inspection = await prisma.inspection.findUnique({
    where: { id },
    select: { id: true, status: true, inspectorId: true },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }

  // Only inspector or gestor/admin can add measurements
  const canAddMeasurement = inspection.inspectorId === session.userId || 
    session.role === "GESTOR" || session.role === "ADMIN_MASTER";
  
  if (!canAddMeasurement) {
    return NextResponse.json({ error: "Sem permissão para adicionar medições." }, { status: 403 });
  }

  // Check if point already exists
  const existing = await prisma.inspectionMeasurement.findUnique({
    where: { inspectionId_point: { inspectionId: id, point } },
  });

  if (existing) {
    return NextResponse.json({ error: "Ponto já existe. Use PUT para atualizar." }, { status: 409 });
  }

  const measurement = await prisma.inspectionMeasurement.create({
    data: {
      inspectionId: id,
      point,
      thicknessMm,
      angleDeg,
      notes,
    },
  });

  return NextResponse.json({ measurement }, { status: 201 });
}