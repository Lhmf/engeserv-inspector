import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const batchMeasurementSchema = z.object({
  measurements: z.array(z.object({
    point: z.string().min(1, "Ponto é obrigatório"),
    thicknessMm: z.number().positive("Espessura deve ser positiva"),
    angleDeg: z.number().int().min(0).max(360).optional().nullable(),
    notes: z.string().optional().nullable(),
  })),
});

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
  const parsed = batchMeasurementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { measurements } = parsed.data;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    select: { id: true, inspectorId: true },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }

  // Delete existing measurements and recreate (simpler than merge)
  await prisma.inspectionMeasurement.deleteMany({
    where: { inspectionId: id },
  });

  const created = [];
  for (const m of measurements) {
    const measurement = await prisma.inspectionMeasurement.create({
      data: {
        inspectionId: id,
        point: m.point,
        thicknessMm: m.thicknessMm,
        angleDeg: m.angleDeg ?? null,
        notes: m.notes ?? null,
      },
    });
    created.push(measurement);
  }

  return NextResponse.json({ measurements: created }, { status: 201 });
}
