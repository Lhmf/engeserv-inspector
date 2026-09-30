import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const equipamentos = await prisma.equipment.findMany({
      where: {
        clientId: session.clientId,
        active: true,
      },
      include: {
        site: { select: { id: true, name: true } },
        inspections: {
          where: { status: "APROVADA" },
          orderBy: { approvedAt: "desc" },
          take: 1,
          select: { approvedAt: true, id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcular validades para cada equipamento
    const equipamentosComValidade = equipamentos.map((eq) => {
      const lastInspection = eq.inspections[0];
      const periodicityMonths = 12;
      let status = "SEM_DATA";
      let diasRestantes = null;
      let venceEm = null;

      if (lastInspection?.approvedAt) {
        const vence = new Date(lastInspection.approvedAt);
        vence.setMonth(vence.getMonth() + periodicityMonths);
        venceEm = vence.toISOString().split("T")[0];

        const hoje = new Date();
        const diffMs = vence.getTime() - hoje.getTime();
        diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) {
          status = "VENCIDO";
        } else if (diasRestantes <= 30) {
          status = "PROXIMO";
        } else {
          status = "OK";
        }
      }

      return {
        id: eq.id,
        tag: eq.tag,
        type: eq.type,
        description: eq.description,
        manufacturer: eq.manufacturer,
        manufactureYear: eq.manufactureYear,
        site: eq.site?.name,
        siteId: eq.site?.id,
        status,
        diasRestantes,
        venceEm,
        lastInspectionAt: lastInspection?.approvedAt?.toISOString().split("T")[0] || null,
      };
    });

    return NextResponse.json({ equipamentos: equipamentosComValidade });
  } catch (err: any) {
    console.error("[PORTAL_EQUIPAMENTOS_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno: " + (err?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}