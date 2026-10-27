import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderOfficialNr13Html } from '@/modules/report/templates/nr13/official-html';

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

  const { id } = await params;
  const report = await prisma.technicalReport.findUnique({
    where: { id },
    include: {
      inspection: { include: { equipment: { include: { client: { include: { documents: true } } } } } },
    },
  });

  if (!report) return new NextResponse('Laudo não encontrado.', { status: 404 });

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

  return new NextResponse(renderOfficialNr13Html(document as any), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="laudo-${report.reportNumber}.html"`,
      'Cache-Control': 'no-store',
    },
  });
}
