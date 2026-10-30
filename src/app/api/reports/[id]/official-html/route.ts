import { NextRequest, NextResponse } from 'next/server';
import { canIssueFinalReport, getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderOfficialNr13Html } from '@/modules/report/templates/nr13/official-html';
import { DEMO_COMPANY_INFO, resolveCompanyInfoFromEnv } from '@/modules/report/company-info';
import { assessTechnicalReportEmission, sanitizeForEmission } from '@/modules/report/safety/emission';

function parseJson(value: unknown) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return new NextResponse('Não autenticado.', { status: 401 });
  if (!canIssueFinalReport(session.role)) return new NextResponse('Sem permissão para acessar o laudo oficial.', { status: 403 });

  const { id } = await params;
  const report = await prisma.technicalReport.findUnique({
    where: { id },
    include: {
      inspection: { include: { equipment: { include: { client: { include: { documents: true } } } } } },
    },
  });

  if (!report) return new NextResponse('Laudo não encontrado.', { status: 404 });

  const assessment = assessTechnicalReportEmission({
    engineeringResults: parseJson(report.engineeringResults),
    metadata: parseJson(report.metadata),
    inspectionData: parseJson(report.inspectionData),
  });
  const demoMode = _request.nextUrl.searchParams.get('mode')?.toLowerCase() === 'demo';
  if (!assessment.canEmitDefinitive && !demoMode) {
    return NextResponse.json({
      error: 'Prévia oficial bloqueada até a validação dos cálculos e do critério de pontos não medidos.',
      code: 'EMISSION_BLOCKED_UNVALIDATED_ENGINEERING',
      reasons: assessment.reasons,
    }, { status: 409 });
  }

  const inspectionData = parseJson(report.inspectionData) || {};
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
    inspectionData: {
      ...inspectionData,
      fieldChecklist: inspectionData.fieldChecklist || (report.inspection as any).fieldChecklist || {},
    },
    engineeringResults: parseJson(report.engineeringResults),
    technicalConclusion: parseJson(report.technicalConclusion),
    recommendations: parseJson(report.recommendations),
    nextInspection: parseJson(report.nextInspection),
    attachments: {
      ...(parseJson(report.attachments) || {}),
      documents: (parseJson(report.attachments)?.documents?.length
        ? parseJson(report.attachments).documents
        : (report.inspection.equipment.client as any).documents || []).map((item: any) => ({
          id: item.id,
          name: item.name || item.originalName,
          type: item.type || item.mimeType,
          url: item.url,
          description: item.description || item.mimeType,
          uploadedAt: item.uploadedAt || item.createdAt,
          uploadedBy: item.uploadedBy || item.uploadedById || '',
        })),
    },
    metadata: parseJson(report.metadata),
  };

  const company = demoMode ? DEMO_COMPANY_INFO : resolveCompanyInfoFromEnv();
  if (!company) {
    return NextResponse.json({
      error: 'Emissão definitiva bloqueada: faltam os dados institucionais da EngeServ.',
      code: 'DEFINITIVE_COMPANY_INFO_REQUIRED',
      required: ['REPORT_COMPANY_NAME', 'REPORT_COMPANY_CNPJ'],
    }, { status: 409 });
  }
  const renderedDocument = demoMode
    ? sanitizeForEmission({
        ...document,
        metadata: {
          ...(document.metadata || {}),
          companyName: company?.name,
          companySite: company?.website,
          companyEmail: company?.email,
        },
      }, 'DEMO', assessment)
    : document;

  return new NextResponse(renderOfficialNr13Html(renderedDocument as any), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="laudo-${report.reportNumber}.html"`,
      'Cache-Control': 'no-store',
    },
  });
}
