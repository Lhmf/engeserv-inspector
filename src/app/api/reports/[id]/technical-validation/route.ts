import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assessTechnicalReportEmission } from "@/modules/report/safety/emission";
import { readTechnicalValidation } from "@/modules/report/safety/technical-validation";

function parseJson(value: unknown): any {
  if (typeof value !== "string") return value || {};
  try { return JSON.parse(value); } catch { return {}; }
}

function serializeForDatabase(value: unknown) {
  // O banco local legado pode estar em WIN1252. Evita que um caractere de
  // substituição recebido de um cliente quebre a aprovação inteira.
  return JSON.stringify(value).replace(/\uFFFD/g, "?");
}

function appendHistory(historyValue: unknown, entry: Record<string, unknown>) {
  const history = parseJson(historyValue);
  const versions = Array.isArray(history?.versions) ? history.versions : [];
  const version = versions.length + 1;
  return {
    versions: [...versions, { version, previousVersion: version - 1, ...entry }],
    currentVersion: version,
    totalVersions: version,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as { action?: string; comments?: string } | null;
  const action = body?.action;
  if (action !== "REQUEST" && action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Ação de validação inválida." }, { status: 400 });
  }

  const report = await prisma.technicalReport.findUnique({
    where: { id },
    select: {
      id: true,
      reportNumber: true,
      version: true,
      history: true,
      metadata: true,
      engineeringResults: true,
      inspectionData: true,
      inspection: { select: { equipment: { select: { tag: true, client: { select: { companyName: true } } } } } },
    },
  });
  if (!report) return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });

  if ((action === "APPROVE" || action === "REJECT") && session.role !== "ADMIN_MASTER") {
    return NextResponse.json({ error: "Somente o Administrador Master pode concluir a validação técnica." }, { status: 403 });
  }

  const metadata = parseJson(report.metadata);
  const current = readTechnicalValidation(metadata);
  const now = new Date().toISOString();
  const technicalValidation = action === "APPROVE"
    ? {
        ...current,
        status: "APPROVED" as const,
        approvedAt: now,
        approvedById: session.userId,
        approvedByName: session.name,
        comments: body?.comments?.trim() || current.comments,
      }
    : action === "REJECT"
      ? {
          ...current,
          status: "REJECTED" as const,
          rejectedAt: now,
          rejectedById: session.userId,
          rejectedByName: session.name,
          comments: body?.comments?.trim() || "A validação precisa de ajustes antes da emissão.",
        }
      : {
          ...current,
          status: "PENDING" as const,
          requestedAt: now,
          requestedById: session.userId,
          requestedByName: session.name,
        };

  // O pedido de validação também registra que o critério dos pontos adotados
  // foi apresentado ao responsável. A decisão continua sendo manual e auditável.
  const nextMetadata = {
    ...metadata,
    technicalValidation,
    ...(action === "APPROVE" ? { regionalAdoptionApproved: true } : {}),
  };
  const assessment = assessTechnicalReportEmission({
    engineeringResults: parseJson(report.engineeringResults),
    inspectionData: parseJson(report.inspectionData),
    metadata: nextMetadata,
  });
  const history = appendHistory(report.history, {
    date: now,
    authorId: session.userId,
    authorName: session.name,
    authorRole: session.role === "ADMIN_MASTER" ? "MANAGER" : "INSPECTOR",
    changes: action === "APPROVE"
      ? "Validação técnica aprovada; emissão definitiva liberada"
      : action === "REJECT"
        ? "Validação técnica rejeitada; ajustes solicitados"
        : "Validação técnica solicitada ao Administrador Master",
    status: action === "APPROVE" ? "APPROVED" : "UNDER_REVIEW",
    action: action === "APPROVE" ? "VALIDATED" : action === "REJECT" ? "VALIDATION_REJECTED" : "VALIDATION_REQUESTED",
  });

  await prisma.technicalReport.update({
    where: { id },
    data: {
      metadata: serializeForDatabase(nextMetadata),
      history: serializeForDatabase(history),
      updatedAt: new Date(),
    },
  });

  if (action === "REQUEST") {
    const masters = await prisma.user.findMany({ where: { role: "ADMIN_MASTER", active: true }, select: { id: true } });
    for (const master of masters) {
      const existingNotification = await prisma.notification.findFirst({
        where: { recipientId: master.id, reportId: id, type: "TECHNICAL_VALIDATION_PENDING", readAt: null },
        select: { id: true },
      });
      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            recipientId: master.id,
            reportId: id,
            type: "TECHNICAL_VALIDATION_PENDING",
            title: "Validação técnica pendente",
            message: `O laudo ${report.reportNumber} (${report.inspection.equipment.tag}) aguarda sua aprovação técnica.`,
          },
        });
      }
    }
  }

  if (action === "APPROVE" || action === "REJECT") {
    await prisma.notification.updateMany({
      where: { reportId: id, type: "TECHNICAL_VALIDATION_PENDING", readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({
    success: true,
    technicalValidation,
    assessment,
    canEmitDefinitive: assessment.canEmitDefinitive,
  });
}
