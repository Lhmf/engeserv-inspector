import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { renderOfficialNr13Html } from '@/modules/report/templates/nr13/official-html';

function parseJson(value: unknown) {
  return typeof value === 'string' ? JSON.parse(value) : value;
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
      inspection: { include: { equipment: { include: { client: true } } } },
    },
  });

  if (!report) return new NextResponse('Laudo não encontrado.', { status: 404 });

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
    inspectionData: parseJson(report.inspectionData),
    engineeringResults: parseJson(report.engineeringResults),
    technicalConclusion: parseJson(report.technicalConclusion),
    recommendations: parseJson(report.recommendations),
    nextInspection: parseJson(report.nextInspection),
    attachments: parseJson(report.attachments),
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
