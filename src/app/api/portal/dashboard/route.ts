import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";

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

    // Calcular validades
    const periodicityMonths = 12;
    let totalEquipamentos = equipamentos.length;
    let proximoVencimento = 0;
    let vencido = 0;

    for (const eq of equipamentos) {
      const lastInspection = eq.inspections[0];
      if (lastInspection?.approvedAt) {
        const vence = new Date(lastInspection.approvedAt);
        vence.setMonth(vence.getMonth() + periodicityMonths);
        const hoje = new Date();
        const diffMs = vence.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
          vencido++;
        } else if (diasRestantes <= 30) {
          proximoVencimento++;
        }
      }
    }

    // Buscar laudos do cliente
    const laudos = await prisma.technicalReport.findMany({
      where: {
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
    if (totalEquipamentos > 0 && vencido === 0 && proximoVencimento === 0) {
      alertas.push("Todos os equipamentos estão em dia com as inspeções.");
    }

    return NextResponse.json({
      stats: {
        totalEquipamentos,
        totalLaudos: laudosVigentes,
        proximoVencimento,
        vencido,
        totalDocumentos: documentosCount,
      },
      alertas,
    });
  } catch (err: any) {
    console.error("[PORTAL_DASHBOARD_API_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno: " + (err?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}