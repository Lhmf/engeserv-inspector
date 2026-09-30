import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { buildValidadeInfo, ordenarPorVencimento } from "@/lib/validades";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const equipments = await prisma.equipment.findMany({
      where: { clientId: session.clientId, active: true },
      include: {
        site: { select: { id: true, name: true } },
        inspections: {
          where: { status: "APROVADA" },
          orderBy: { approvedAt: "desc" },
          take: 1,
          select: { approvedAt: true, id: true },
        },
      },
    });

    let validades = equipments.map((eq) => {
      const lastInspection = eq.inspections[0];
      const periodicityMonths = 12; // padrão 12 meses
      return buildValidadeInfo({
        equipmentId: eq.id,
        equipmentTag: eq.tag,
        equipmentType: eq.type,
        clientName: session.name,
        clientId: session.clientId,
        lastApprovedAt: lastInspection?.approvedAt || null,
        periodicityMonths,
      });
    });

    // Ordenar por vencimento mais próximo
    validades = ordenarPorVencimento(validades);

    const stats = {
      total: equipments.length,
      vencido: validades.filter((v) => v.status === "VENCIDO").length,
      proximo: validades.filter((v) => v.status === "PROXIMO").length,
      ok: validades.filter((v) => v.status === "OK").length,
      semData: validades.filter((v) => v.status === "SEM_DATA").length,
    };

    return NextResponse.json({ validades, stats });
  } catch (error: any) {
    console.error("[PORTAL_CALENDARIO_ERROR]", error?.message ?? error);
    return NextResponse.json(
      { error: "Erro interno: " + (error?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}