import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body || !body.status) {
    return NextResponse.json(
      { error: "Status é obrigatório." },
      { status: 400 }
    );
  }

  const { status, action, stepId } = body;

  // Validar status
  const validStatuses = ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Status inválido: ${status}` },
      { status: 400 }
    );
  }

  // Buscar laudo atual
  const existing = await prisma.technicalReport.findUnique({
    where: { id },
    select: { 
      id: true, 
      status: true, 
      inspectionId: true,
      reportNumber: true,
      history: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });
  }

  // Regras de transição de status (baseado no TechnicalReportStatus enum)
  const validTransitions: Record<string, string[]> = {
    DRAFT: ["UNDER_REVIEW", "ARCHIVED"],
    UNDER_REVIEW: ["APPROVED", "REJECTED", "DRAFT"],
    APPROVED: ["PUBLISHED", "UNDER_REVIEW"],
    REJECTED: ["DRAFT", "UNDER_REVIEW"],
    PUBLISHED: ["ARCHIVED"],
    ARCHIVED: [],
  };

  if (!validTransitions[existing.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Transição inválida de ${existing.status} para ${status}.` },
      { status: 400 }
    );
  }

  // Preparar histórico
  let historyObj: { versions: any[]; currentVersion: number; totalVersions: number } = {
    versions: [],
    currentVersion: 0,
    totalVersions: 0,
  };
  
  if (typeof existing.history === "string") {
    try {
      historyObj = JSON.parse(existing.history);
    } catch {
      historyObj = { versions: [], currentVersion: 0, totalVersions: 0 };
    }
  } else if (existing.history && typeof existing.history === "object") {
    historyObj = existing.history as { versions: any[]; currentVersion: number; totalVersions: number };
  }

  const newVersion = (historyObj.versions?.length || 0) + 1;
  const actionLabel = action === "skip" ? "Etapa pulada" : "Etapa concluída";
  const stepNameMap: Record<string, string> = {
    draft: "Rascunho",
    review: "Em Revisão",
    validation: "Validação Engenharia",
    approval: "Aprovação Gestor",
    published: "Publicado",
  };

  const newHistoryEntry = {
    version: newVersion,
    date: new Date().toISOString(),
    authorId: session.userId,
    authorName: session.name,
    authorRole: session.role === "ADMIN_MASTER" ? "MANAGER" : session.role === "GESTOR" ? "ENGINEER" : "INSPECTOR",
    changes: `${actionLabel}: ${stepNameMap[stepId] || stepId} → ${status}`,
    status,
    action: action === "skip" ? "SKIPPED" : "COMPLETED",
    previousVersion: newVersion - 1,
  };

  // Atualizar histórico
  const updatedHistory = {
    versions: [...(historyObj.versions || []), newHistoryEntry],
    currentVersion: newVersion,
    totalVersions: newVersion,
  };

  // Atualizar o laudo
  const technicalReport = await prisma.technicalReport.update({
    where: { id },
    data: {
      status,
      history: JSON.stringify(updatedHistory),
      updatedAt: new Date(),
    },
    include: {
      inspection: {
        include: {
          equipment: {
            include: { client: true },
          },
        },
      },
    },
  });

  // Reconstruir objeto TechnicalReport para retorno
  const parseJson = (data: any) => typeof data === "string" ? JSON.parse(data) : data;
  const report = {
    id: technicalReport.id,
    identification: {
      reportNumber: technicalReport.reportNumber,
      version: technicalReport.version,
      type: technicalReport.type,
      status: technicalReport.status,
      artNumber: technicalReport.artNumber,
      inspectionDate: technicalReport.inspectionDate,
      createdAt: technicalReport.createdAt,
      updatedAt: technicalReport.updatedAt,
      issuedAt: technicalReport.issuedAt,
      expiresAt: technicalReport.expiresAt,
      inspectorId: technicalReport.inspectorId,
      inspectorName: technicalReport.inspectorName,
      engineerId: technicalReport.engineerId,
      engineerName: technicalReport.engineerName,
      managerId: technicalReport.managerId,
      managerName: technicalReport.managerName,
    },
    client: parseJson(technicalReport.clientData),
    equipment: parseJson(technicalReport.equipmentData),
    executiveSummary: parseJson(technicalReport.executiveSummary),
    inspectionData: parseJson(technicalReport.inspectionData),
    engineeringResults: parseJson(technicalReport.engineeringResults),
    technicalConclusion: parseJson(technicalReport.technicalConclusion),
    recommendations: parseJson(technicalReport.recommendations),
    nextInspection: parseJson(technicalReport.nextInspection),
    attachments: parseJson(technicalReport.attachments),
    history: parseJson(technicalReport.history),
    validations: parseJson(technicalReport.validations),
    signatures: parseJson(technicalReport.signatures),
    metadata: parseJson(technicalReport.metadata),
  };

  return NextResponse.json({ 
    technicalReport: report,
    reportId: technicalReport.id,
  });
}