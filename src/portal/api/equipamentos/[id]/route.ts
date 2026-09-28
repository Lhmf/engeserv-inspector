import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";

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
          include: {
            technicalReport: true,
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
          recomendacoes: insp.recommendations,
          laudo: insp.technicalReport
            ? {
                numero: insp.technicalReport.reportNumber,
                versao: insp.technicalReport.version,
                status: insp.technicalReport.status,
                vigente: !!(insp.technicalReport.expiresAt && new Date(insp.technicalReport.expiresAt) > new Date()),
              }
            : null,
        })),
    };

    return NextResponse.json({ equipamento: formatted });
  } catch (err: any) {
    console.error("[PORTAL_EQUIPAMENTO_ID_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno: " + (err?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}