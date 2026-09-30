import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Buscar recomendações de inspeções
    const inspections = await prisma.inspection.findMany({
      where: {
        equipment: { clientId: session.clientId },
        recommendations: { not: "" },
      },
      include: {
        equipment: { select: { id: true, tag: true, type: true } },
        technicalReport: { select: { reportNumber: true, id: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Buscar recomendações de laudos técnicos
    const technicalReports = await prisma.technicalReport.findMany({
      where: {
        inspection: { equipment: { clientId: session.clientId } },
        recommendations: { not: "" },
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
      if (insp.recommendations) {
        recomendacoes.push({
          id: insp.id,
          equipamento: insp.equipment.tag,
          tag: insp.equipment.tag,
          tipo: insp.equipment.type,
          recomendacao: insp.recommendations,
          origem: "INSPECAO",
          data: insp.updatedAt?.toISOString().split("T")[0] || insp.startedAt?.toISOString().split("T")[0] || "",
          status: insp.status,
        });
      }
    }

    // Adicionar recomendações de laudos
    for (const laudo of technicalReports) {
      if (laudo.recommendations) {
        const recs = laudo.recommendations as string;
        recomendacoes.push({
          id: laudo.id,
          equipamento: laudo.inspection?.equipment?.tag || "N/A",
          tag: laudo.inspection?.equipment?.tag || "N/A",
          tipo: laudo.inspection?.equipment?.type || "N/A",
          recomendacao: recs,
          origem: "LAUDO",
          data: laudo.updatedAt?.toISOString().split("T")[0] || laudo.issuedAt?.toISOString().split("T")[0] || "",
          status: laudo.status,
        });
      }
    }

    // Ordenar por data mais recente
    recomendacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    return NextResponse.json({ recomendacoes });
  } catch (err: any) {
    console.error("[PORTAL_RECOMENDACOES_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno: " + (err?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}