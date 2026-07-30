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

      return NextResponse.json({ report: result.report, reportId: result.report.id });
    }

    // Without a real report store, return not found for direct reportId lookup
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

    return NextResponse.json({
      success: true,
      report: result.report,
      reportId: result.report?.id,
      steps: result.steps.map(s => ({ step: s.step, status: s.status })),
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || "Erro ao gerar laudo",
    }, { status: 500 });
  }
}
