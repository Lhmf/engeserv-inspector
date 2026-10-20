import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { buildValidadeInfo, diasRestantesAte } from "@/lib/validades";

// Rota protegida por cookie de sessão: nunca prerender e produzir
// logs falsos de "Dynamic server usage" durante o build.
export const dynamic = "force-dynamic";

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

    // Calcular validades usando a lib unificada
    const equipamentosComValidade = equipamentos.map((eq) => {
      const info = buildValidadeInfo({
        equipmentId: eq.id,
        equipmentTag: eq.tag,
        equipmentType: eq.type,
        clientName: session.name || "",
        clientId: session.clientId,
        lastApprovedAt: eq.inspections[0]?.approvedAt || null,
        periodicityMonths: 12,
      });

      return {
        id: eq.id,
        tag: eq.tag,
        type: eq.type,
        description: eq.description,
        manufacturer: eq.manufacturer,
        manufactureYear: eq.manufactureYear,
        site: eq.site?.name,
        siteId: eq.site?.id,
        status: info.status,
        diasRestantes: diasRestantesAte(info.nextDueDate),
        venceEm: info.nextDueDate?.toISOString().split("T")[0] || null,
        lastInspectionAt: eq.inspections[0]?.approvedAt?.toISOString().split("T")[0] || null,
      };
    });

    return NextResponse.json({ equipamentos: equipamentosComValidade });
  } catch (err: any) {
    console.error("[PORTAL_EQUIPAMENTOS_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
