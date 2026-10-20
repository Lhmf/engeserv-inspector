import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { PORTAL_VISIBLE_REPORT_STATUSES } from "@/portal/lib/portal-visible-states";
import { formatarRecomendacoes } from "@/portal/lib/portal-recommendations";
import { prisma } from "@/lib/prisma";

// Rota protegida por cookie de sessão: nunca prerender e produzir
// logs falsos de "Dynamic server usage" durante o build.
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const laudo = await prisma.technicalReport.findFirst({
      where: {
        id: params.id,
        // Visibilidade: só detalha laudos aprovados/publicados.
        status: { in: PORTAL_VISIBLE_REPORT_STATUSES },
        inspection: {
          equipment: {
            clientId: session.clientId,
          },
        },
      },
      include: {
        inspection: {
          include: {
            equipment: {
              select: {
                id: true,
                tag: true,
                type: true,
                clientId: true,
                client: { select: { id: true, companyName: true } },
                site: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!laudo) {
      return NextResponse.json(
        { error: "Laudo não encontrado ou acesso não autorizado." },
        { status: 404 }
      );
    }

    const formatted = {
      id: laudo.id,
      reportNumber: laudo.reportNumber,
      version: laudo.version,
      status: laudo.status,
      inspectionDate: laudo.inspectionDate.toISOString().split("T")[0],
      issuedAt: laudo.issuedAt?.toISOString().split("T")[0] || null,
      expiresAt: laudo.expiresAt?.toISOString().split("T")[0] || null,
      vigente: !!(laudo.expiresAt && new Date(laudo.expiresAt) > new Date()),
      recommendations: formatarRecomendacoes(laudo.recommendations),
      equipment: laudo.inspection?.equipment
        ? {
            id: laudo.inspection.equipment.id,
            tag: laudo.inspection.equipment.tag,
            type: laudo.inspection.equipment.type,
            clientName: laudo.inspection.equipment.client?.companyName,
            site: laudo.inspection.equipment.site?.name,
          }
        : null,
      site: laudo.inspection?.equipment?.site?.name || null,
    };

    return NextResponse.json({ laudo: formatted });
  } catch (err: any) {
    console.error("[PORTAL_LAUDO_ID_ERROR]", err?.message ?? err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}