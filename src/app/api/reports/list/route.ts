import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const technicalReports = await prisma.technicalReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        inspection: {
          select: {
            equipment: {
              select: {
                tag: true,
                client: {
                  select: {
                    companyName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const reports = technicalReports.map((r) => ({
      id: r.id,
      reportNumber: r.reportNumber,
      equipmentTag: r.inspection?.equipment?.tag || 'N/A',
      clientName: r.inspection?.equipment?.client?.companyName || 'N/A',
      status: r.status,
      version: r.version,
      createdAt: r.createdAt.toISOString(),
      inspectionDate: r.inspectionDate.toISOString(),
    }));

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Erro ao listar laudos:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar laudos' }, { status: 500 });
  }
}