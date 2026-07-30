import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildValidadeInfo } from "@/lib/validades";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientFilter = searchParams.get("clientId");
  const statusFilter = searchParams.get("status");

  try {
    const equipments = await prisma.equipment.findMany({
      where: { active: true },
      include: {
        client: { select: { id: true, companyName: true } },
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
      const periodicityMonths = 12;
      return buildValidadeInfo({
        equipmentId: eq.id,
        equipmentTag: eq.tag,
        equipmentType: eq.type,
        clientName: eq.client.companyName,
        clientId: eq.client.id,
        lastApprovedAt: lastInspection?.approvedAt || null,
        periodicityMonths,
      });
    });

    if (clientFilter && clientFilter !== "all") {
      validades = validades.filter((v) => (v as any).clientId === clientFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      validades = validades.filter((v) => v.status === statusFilter);
    }

    const stats = {
      total: equipments.length,
      vencido: validades.filter((v) => v.status === "VENCIDO").length,
      proximo: validades.filter((v) => v.status === "PROXIMO").length,
      ok: validades.filter((v) => v.status === "OK").length,
      semData: validades.filter((v) => v.status === "SEM_DATA").length,
    };

    return NextResponse.json({ validades, stats });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao carregar validades" }, { status: 500 });
  }
}
