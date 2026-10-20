import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import {
  PORTAL_VISIBLE_INSPECTION_STATUSES,
  PORTAL_VISIBLE_REPORT_STATUSES,
} from "@/portal/lib/portal-visible-states";
import { formatarRecomendacoes } from "@/portal/lib/portal-recommendations";
import { prisma } from "@/lib/prisma";

// Rota protegida por cookie de sessão: nunca prerender e produzir
// logs falsos de "Dynamic server usage" durante o build.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Buscar recomendações de inspeções (apenas inspeções APROVADAS).
    const inspections = await prisma.inspection.findMany({
      where: {
        equipment: { clientId: session.clientId },
        recommendations: { not: "" },
        status: { in: PORTAL_VISIBLE_INSPECTION_STATUSES },
      },
      include: {
        equipment: { select: { id: true, tag: true, type: true } },
        technicalReport: { select: { reportNumber: true, id: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Buscar recomendações de laudos técnicos (apenas laudos visíveis).
    const technicalReports = await prisma.technicalReport.findMany({
      where: {
        inspection: { equipment: { clientId: session.clientId } },
        recommendations: { not: "" },
        status: { in: PORTAL_VISIBLE_REPORT_STATUSES },
      },
      include: {
        inspection: {
          select: {
            equipment: { select: { id: true, tag: true, type: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const recomendacoes: Array<{
      id: string;
      equipamento: string;
      tag: string;
      tipo: string;
      recomendacao: string;
      origem: "INSPECAO" | "LAUDO";
      data: string;
      status: string;
    }> = [];

    // Adicionar recomendações de inspeções
    for (const insp of inspections) {
      const texto = formatarRecomendacoes(insp.recommendations);
      if (texto) {
        recomendacoes.push({
          id: insp.id,
          equipamento: insp.equipment.tag,
          tag: insp.equipment.tag,
          tipo: insp.equipment.type,
          recomendacao: texto,
          origem: "INSPECAO",
          data: insp.updatedAt?.toISOString().split("T")[0] || insp.startedAt?.toISOString().split("T")[0] || "",
          status: insp.status,
        });
      }
    }

    // Adicionar recomendações de laudos
    for (const laudo of technicalReports) {
      const texto = formatarRecomendacoes(laudo.recommendations);
      if (texto) {
        recomendacoes.push({
          id: laudo.id,
          equipamento: laudo.inspection?.equipment?.tag || "N/A",
          tag: laudo.inspection?.equipment?.tag || "N/A",
          tipo: laudo.inspection?.equipment?.type || "N/A",
          recomendacao: texto,
          origem: "LAUDO",
          data: laudo.updatedAt?.toISOString().split("T")[0] || laudo.issuedAt?.toISOString().split("T")[0] || "",
          status: laudo.status,
        });
      }
    }

    // Ordenar por data mais recente (data vazia → 0, sem NaN no comparador)
    const timestamp = (data: string): number => {
      const t = data ? new Date(data).getTime() : 0;
      return Number.isNaN(t) ? 0 : t;
    };
    recomendacoes.sort((a, b) => timestamp(b.data) - timestamp(a.data));

    return NextResponse.json({ recomendacoes });
  } catch (err: any) {
    console.error("[PORTAL_RECOMENDACOES_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}