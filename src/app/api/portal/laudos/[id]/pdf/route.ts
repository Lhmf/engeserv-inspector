import { NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { PORTAL_VISIBLE_REPORT_STATUSES } from "@/portal/lib/portal-visible-states";
import { renderOfficialNr13Html } from "@/modules/report/templates/nr13/official-html";
import { renderHtmlToPdf } from "@/modules/report/pdf/server-renderer";
import { resolveCompanyInfoFromEnv } from "@/modules/report/company-info";
import { assessTechnicalReportEmission } from "@/modules/report/safety/emission";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function parseJson(value: unknown) {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getPortalSession();
  if (!session?.clientId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const report = await prisma.technicalReport.findFirst({
      where: {
        id: params.id,
        status: { in: PORTAL_VISIBLE_REPORT_STATUSES },
        inspection: { equipment: { clientId: session.clientId } },
      },
      include: {
        inspection: {
          include: {
            equipment: { include: { client: { include: { documents: true } } } },
          },
        },
      },
    });

    if (!report) return NextResponse.json({ error: "Laudo não encontrado ou acesso não autorizado." }, { status: 404 });

    const attachments = parseJson(report.attachments) as Record<string, any> | null;
    const document = {
      id: report.id,
      identification: {
        reportNumber: report.reportNumber,
        version: report.version,
        type: report.type,
        status: report.status,
        inspectionDate: report.inspectionDate,
        expiresAt: report.expiresAt,
        artNumber: report.artNumber,
        inspectorId: report.inspectorId,
        inspectorName: report.inspectorName,
        engineerName: report.engineerName,
      },
      client: parseJson(report.clientData),
      equipment: parseJson(report.equipmentData),
      executiveSummary: parseJson(report.executiveSummary),
      inspectionData: parseJson(report.inspectionData) || {},
      engineeringResults: parseJson(report.engineeringResults),
      technicalConclusion: parseJson(report.technicalConclusion),
      recommendations: parseJson(report.recommendations),
      nextInspection: parseJson(report.nextInspection),
      attachments: {
        ...(attachments || {}),
        documents: attachments?.documents?.length
          ? attachments.documents
          : report.inspection.equipment.client.documents.map((item) => ({
              id: item.id,
              name: item.originalName,
              type: item.type,
              url: item.url,
              description: item.mimeType,
              uploadedAt: item.createdAt,
              uploadedBy: item.uploadedById,
            })),
      },
      metadata: (parseJson(report.metadata) as Record<string, any> | null) || {},
    };

    const assessment = assessTechnicalReportEmission(document);
    if (!assessment.canEmitDefinitive) {
      return NextResponse.json({
        error: "Emissão bloqueada: este laudo não possui validação técnica definitiva.",
        code: "EMISSION_BLOCKED_UNVALIDATED_ENGINEERING",
        reasons: assessment.reasons,
      }, { status: 409 });
    }

    const company = resolveCompanyInfoFromEnv();
    if (!company) return NextResponse.json({ error: "Empresa emitente não configurada." }, { status: 503 });

    const html = renderOfficialNr13Html({
      ...document,
      metadata: { ...(document.metadata || {}), companyName: company.name, companyCnpj: company.cnpj },
    } as any);
    const pdfBytes = await renderHtmlToPdf(html);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="laudo-${report.reportNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error: any) {
    console.error("[PORTAL_LAUDO_PDF_ERROR]", error?.message ?? error);
    return NextResponse.json({ error: "Não foi possível gerar o PDF." }, { status: 503 });
  }
}
