import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { PORTAL_VISIBLE_REPORT_STATUSES } from "@/portal/lib/portal-visible-states";
import { prisma } from "@/lib/prisma";
import { buildValidadeInfo } from "@/lib/validades";

// Rota protegida por cookie de sessão: nunca prerender e produzir
// logs falsos de "Dynamic server usage" durante o build.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const clientId = session.clientId;

    // Buscar equipamentos do cliente
    const equipamentos = await prisma.equipment.findMany({
      where: { clientId, active: true },
      include: {
        inspections: {
          where: { status: "APROVADA" },
          orderBy: { approvedAt: "desc" },
          take: 1,
          select: { approvedAt: true, id: true },
        },
      },
    });

    // Calcular validades usando a lib unificada
    let totalEquipamentos = equipamentos.length;
    let regulares = 0;
    let proximoVencimento = 0;
    let vencido = 0;
    let semData = 0;

    for (const eq of equipamentos) {
      const info = buildValidadeInfo({
        equipmentId: eq.id,
        equipmentTag: eq.tag,
        equipmentType: eq.type,
        clientName: session.name || "",
        clientId: clientId,
        lastApprovedAt: eq.inspections[0]?.approvedAt || null,
        periodicityMonths: 12,
      });

      if (info.status === "VENCIDO") vencido++;
      else if (info.status === "PROXIMO") proximoVencimento++;
      else if (info.status === "OK") regulares++;
      else semData++;
    }

    // Buscar laudos do cliente (apenas estados visíveis ao portal)
    const laudos = await prisma.technicalReport.findMany({
      where: {
        status: { in: PORTAL_VISIBLE_REPORT_STATUSES },
        inspection: {
          equipment: {
            clientId,
          },
        },
      },
      select: { id: true, status: true, expiresAt: true },
    });

    const laudosVigentes = laudos.filter((l) => l.expiresAt && new Date(l.expiresAt) > new Date()).length;

    // Buscar documentos do cliente
    const documentosCount = await prisma.clientDocument.count({
      where: { clientId },
    });

    // Alertas detalhados
    const alertas: string[] = [];
    if (vencido > 0) {
      alertas.push(`${vencido} equipamento(s) com laudo vencido`);
    }
    if (proximoVencimento > 0) {
      alertas.push(`${proximoVencimento} equipamento(s) com laudo próximo do vencimento`);
    }
    if (semData > 0) {
      alertas.push(`${semData} equipamento(s) sem data de validade definida`);
    }
    if (totalEquipamentos > 0 && vencido === 0 && proximoVencimento === 0 && semData === 0) {
      alertas.push("Todos os equipamentos estão em dia com as inspeções.");
    }

    return NextResponse.json({
      stats: {
        totalEquipamentos,
        regulares,
        proximoVencimento,
        vencido,
        semData,
        totalLaudos: laudosVigentes,
        totalDocumentos: documentosCount,
      },
      alertas,
    });
  } catch (err: any) {
    console.error("[PORTAL_DASHBOARD_API_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
