import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";
import { buildValidadeInfo, diasRestantesAte } from "@/lib/validades";

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

    const frente = await prisma.clientSite.findFirst({
      where: {
        id: params.id,
        clientId: session.clientId,
      },
      include: {
        client: { select: { companyName: true } },
        equipments: {
          where: { active: true },
          select: {
            id: true,
            tag: true,
            type: true,
            description: true,
            manufacturer: true,
            manufactureYear: true,
            inspections: {
              where: { status: "APROVADA" },
              orderBy: { approvedAt: "desc" },
              take: 1,
              select: { approvedAt: true, id: true },
            },
          },
          orderBy: { tag: "asc" },
        },
      },
    });

    if (!frente) {
      return NextResponse.json(
        { error: "Frente não encontrada ou acesso não autorizado." },
        { status: 404 }
      );
    }

    const equipamentosComValidade = frente.equipments.map((eq) => {
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
        status: info.status,
        diasRestantes: diasRestantesAte(info.nextDueDate),
        venceEm: info.nextDueDate?.toISOString().split("T")[0] || null,
        lastInspectionAt: eq.inspections[0]?.approvedAt?.toISOString().split("T")[0] || null,
      };
    });

    const formatted = {
      id: frente.id,
      name: frente.name,
      address: frente.address,
      clientName: frente.client?.companyName ?? null,
      equipments: equipamentosComValidade,
      equipmentsCount: frente.equipments.length,
    };

    return NextResponse.json({ frente: formatted });
  } catch (err: any) {
    console.error("[PORTAL_FRENTE_ID_ERROR]", err?.message ?? err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
