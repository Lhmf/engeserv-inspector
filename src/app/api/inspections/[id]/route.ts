import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canApproveInspection } from "@/lib/auth";

const updateInspectionSchema = z.object({
  status: z.enum(["EM_ANDAMENTO", "AGUARDANDO_APROVACAO", "APROVADA", "REJEITADA"]).optional(),
  rejectionReason: z.string().optional(),
  completedAt: z.string().datetime().optional(),
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

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      equipment: {
        select: { id: true, tag: true, type: true, client: { select: { id: true, companyName: true } } },
      },
      inspector: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      photos: {
        orderBy: { order: "asc" },
        select: { id: true, url: true, category: true, caption: true, order: true, uploadedBy: { select: { name: true } }, createdAt: true },
      },
      measurements: {
        orderBy: { point: "asc" },
        select: { id: true, point: true, thicknessMm: true, angleDeg: true, notes: true, createdAt: true },
      },
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ inspection });
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
  const parsed = updateInspectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const { status, rejectionReason, completedAt } = parsed.data;

  const existing = await prisma.inspection.findUnique({
    where: { id },
    select: { id: true, status: true, inspectorId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }

  // Permissões
  if (status === "APROVADA" || status === "REJEITADA") {
    if (!canApproveInspection(session.role)) {
      return NextResponse.json({ error: "Apenas Gestor ou Admin Master podem aprovar/rejeitar." }, { status: 403 });
    }
  }

  // Regras de transição de status
  const validTransitions: Record<string, string[]> = {
    EM_ANDAMENTO: ["AGUARDANDO_APROVACAO"],
    AGUARDANDO_APROVACAO: ["APROVADA", "REJEITADA", "EM_ANDAMENTO"],
    APROVADA: [],
    REJEITADA: ["EM_ANDAMENTO"],
  };

  if (status && !validTransitions[existing.status]?.includes(status)) {
    return NextResponse.json({ error: `Transição inválida de ${existing.status} para ${status}.` }, { status: 400 });
  }

  if (status === "REJEITADA" && !rejectionReason) {
    return NextResponse.json({ error: "Motivo da rejeição é obrigatório." }, { status: 400 });
  }

  const updateData: any = {};
  if (status) updateData.status = status;
  if (rejectionReason) updateData.rejectionReason = rejectionReason;
  if (completedAt) updateData.completedAt = new Date(completedAt);

  if (status === "APROVADA") {
    updateData.approvedAt = new Date();
    updateData.approvedById = session.userId;
  }
  if (status === "REJEITADA") {
    updateData.approvedAt = new Date();
    updateData.approvedById = session.userId;
  }
  if (status === "AGUARDANDO_APROVACAO") {
    updateData.completedAt = new Date();
  }

  const inspection = await prisma.inspection.update({
    where: { id },
    data: updateData,
    include: {
      equipment: { select: { id: true, tag: true, type: true, client: { select: { companyName: true } } } },
      inspector: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ inspection });
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

  const existing = await prisma.inspection.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }

  // Regra: não apagar, apenas cancelar/arquivar
  if (existing.status === "APROVADA") {
    return NextResponse.json({ error: "Inspeção aprovada não pode ser cancelada." }, { status: 400 });
  }

  await prisma.inspection.update({
    where: { id },
    data: { status: "REJEITADA", rejectionReason: "Cancelada pelo usuário" },
  });

  return NextResponse.json({ message: "Inspeção cancelada (arquivada)." });
}