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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // ISOLAMENTO: Buscar equipamento apenas se pertencer ao clientId da sessão
    const equipamento = await prisma.equipment.findFirst({
      where: {
        id: params.id,
        clientId: session.clientId,
      },
      include: {
        client: { select: { id: true, companyName: true } },
        site: { select: { id: true, name: true, address: true } },
        inspections: {
          // Visibilidade: apenas inspeções APROVADAS (estados internos
          // EM_ANDAMENTO/AGUARDANDO_APROVACAO/REJEITADA ficam ocultos).
          where: { status: { in: PORTAL_VISIBLE_INSPECTION_STATUSES } },
          include: {
            technicalReport: {
              // O laudo anexado só é exposto em estados visíveis.
              where: { status: { in: PORTAL_VISIBLE_REPORT_STATUSES } },
            },
          },
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!equipamento) {
      return NextResponse.json(
        { error: "Equipamento não encontrado ou acesso não autorizado." },
        { status: 404 }
      );
    }

    // Formatar dados para o portal
    const formatted = {
      id: equipamento.id,
      tag: equipamento.tag,
      type: equipamento.type,
      description: equipamento.description,
      manufacturer: equipamento.manufacturer,
      manufactureYear: equipamento.manufactureYear,

      // Dados de Projeto
      designPressureBar: equipamento.designPressureBar,
      operatingPressureBar: equipamento.operatingPressureBar,
      operatingTempC: equipamento.operatingTempC,
      mawpBar: equipamento.mawpBar,
      volumeLiters: equipamento.volumeLiters,
      designCode: equipamento.designCode,
      fluidType: equipamento.fluidType,
      fluidClass: equipamento.fluidClass,
      riskGroup: equipamento.riskGroup,
      nr13Category: equipamento.nr13Category,

      // Condições de Construção
      originalThicknessMm: equipamento.originalThicknessMm,
      minThicknessMm: equipamento.minThicknessMm,
      headType: equipamento.headType,
      headMaterial: equipamento.headMaterial,
      headNominalThicknessMm: equipamento.headNominalThicknessMm,
      jointEfficiency: equipamento.jointEfficiency,
      corrosionAllowanceMm: equipamento.corrosionAllowanceMm,

      // Localização
      site: equipamento.site?.name,
      siteAddress: equipamento.site?.address,

      // Histórico
      totalInspecoes: equipamento.inspections?.length || 0,
      ultimasInspecoes: equipamento.inspections
        ?.slice(0, 5)
        .map((insp) => ({
          id: insp.id,
          tipo: insp.type,
          status: insp.status,
          dataInicial: insp.startedAt?.toISOString?.()?.split("T")[0],
          dataConclusao: insp.completedAt?.toISOString?.()?.split("T")[0],
          observacoes: insp.notes,
          // Formatação server-side (texto plano) do JSON cru de
          // Inspection.recommendations. Idempotente: a página aplica o seu
          // formatador local por cima e mantém a mesma resposta funcional.
          recomendacoes: formatarRecomendacoes(insp.recommendations),
          laudo: insp.technicalReport
            ? {
                id: insp.technicalReport.id,
                numero: insp.technicalReport.reportNumber,
                versao: insp.technicalReport.version,
                status: insp.technicalReport.status,
                vigente: !!(
                  insp.technicalReport.expiresAt &&
                  new Date(insp.technicalReport.expiresAt) > new Date()
                ),
              }
            : null,
        })),
    };

    return NextResponse.json({ equipamento: formatted });
  } catch (err: any) {
    console.error("[PORTAL_EQUIPAMENTO_ID_ERROR]", err?.message ?? err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}