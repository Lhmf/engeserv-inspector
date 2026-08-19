import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InspectionReportPipeline } from "@/modules/report/pipeline/service";

const pipeline = new InspectionReportPipeline();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get("id");
  const inspectionId = searchParams.get("inspectionId");

  if (!reportId && !inspectionId) {
    return NextResponse.json({ error: "Parâmetro id ou inspectionId obrigatório." }, { status: 400 });
  }

  try {
    // If we have an inspectionId, run the pipeline to generate the report
    if (inspectionId) {
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        select: { id: true, equipmentId: true },
      });

      if (!inspection) {
        return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
      }

      const result = await pipeline.execute({
        inspectionId,
        equipmentId: inspection.equipmentId,
        options: {
          templateId: "DEFAULT_NR13",
          templateVersion: "1.0",
          includeSimulations: true,
          initiatedBy: {
            id: session.userId,
            name: session.name,
            role: session.role === "ADMIN_MASTER" ? "MANAGER" : session.role === "GESTOR" ? "ENGINEER" : "INSPECTOR",
          },
        },
      });

      if (!result.success || !result.report) {
        return NextResponse.json({ error: "Falha ao gerar laudo", details: result.errors.map((e: any) => e.message) }, { status: 500 });
      }

      // Retornar o reportId real do banco (salvo no SAVE_DRAFT)
      return NextResponse.json({ 
        report: result.report, 
        reportId: result.report.id,
        technicalReportId: result.steps.find(s => s.step === 'SAVE_DRAFT')?.data?.savedReportId 
      });
    }

    // Buscar laudo real persistido pelo reportId
    if (reportId) {
      const technicalReport = await prisma.technicalReport.findUnique({
        where: { id: reportId },
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

      if (!technicalReport) {
        return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });
      }

      // Reconstruir o objeto TechnicalReport a partir dos dados JSON salvos
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
        client: JSON.parse(technicalReport.clientData),
        equipment: JSON.parse(technicalReport.equipmentData),
        executiveSummary: JSON.parse(technicalReport.executiveSummary),
        inspectionData: JSON.parse(technicalReport.inspectionData),
        engineeringResults: JSON.parse(technicalReport.engineeringResults),
        technicalConclusion: JSON.parse(technicalReport.technicalConclusion),
        recommendations: JSON.parse(technicalReport.recommendations),
        nextInspection: JSON.parse(technicalReport.nextInspection),
        attachments: JSON.parse(technicalReport.attachments),
        history: JSON.parse(technicalReport.history),
        validations: JSON.parse(technicalReport.validations),
        signatures: JSON.parse(technicalReport.signatures),
        metadata: JSON.parse(technicalReport.metadata),
      };

      return NextResponse.json({ report, reportId: technicalReport.id });
    }

    return NextResponse.json({ error: "Laudo não encontrado em armazenamento permanente." }, { status: 404 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao carregar laudo" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.inspectionId) {
    return NextResponse.json({ error: "inspectionId é obrigatório." }, { status: 400 });
  }

  const { inspectionId, equipmentId, options } = body;

  try {
    // Validate inspection exists and is ready
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: {
        id: true,
        status: true,
        equipmentId: true,
        inspectorId: true,
        equipment: { select: { id: true, tag: true } },
        inspector: { select: { id: true, name: true } },
      },
    });

    if (!inspection) {
      return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
    }

    const eqId = equipmentId || inspection.equipmentId;

    // Execute the pipeline
    const result = await pipeline.execute({
      inspectionId,
      equipmentId: eqId,
      options: {
        templateId: options?.templateId || "DEFAULT_NR13",
        templateVersion: options?.templateVersion || "1.0",
        includeSimulations: options?.includeSimulations !== false,
        initiatedBy: {
          id: session.userId,
          name: session.name,
          role: session.role === "ADMIN_MASTER" ? "MANAGER" : session.role === "GESTOR" ? "ENGINEER" : "INSPECTOR",
        },
        skipSteps: options?.skipSteps,
      },
    });

    if (!result.success) {
      return NextResponse.json({
        error: "Pipeline falhou",
        details: result.errors.map(e => e.message),
        steps: result.steps.map(s => ({ step: s.step, status: s.status, message: s.message })),
      }, { status: 500 });
    }

    // Buscar o ID real do TechnicalReport salvo no banco
    const technicalReport = await prisma.technicalReport.findUnique({
      where: { inspectionId },
    });

    return NextResponse.json({
      success: true,
      report: result.report,
      reportId: result.report?.id,
      technicalReportId: technicalReport?.id,
      steps: result.steps.map(s => ({ step: s.step, status: s.status })),
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Erro ao gerar laudo",
    }, { status: 500 });
  }
}
