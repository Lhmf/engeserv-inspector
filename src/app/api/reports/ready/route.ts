import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    // Buscar inspeções APROVADA que NÃO possuem TechnicalReport
    const inspections = await prisma.inspection.findMany({
      where: {
        status: "APROVADA",
        technicalReport: null,
      },
      include: {
        equipment: {
          select: {
            id: true,
            tag: true,
            type: true,
            client: { select: { id: true, companyName: true } },
          },
        },
        inspector: { select: { id: true, name: true } },
        technicalReport: { select: { id: true } },
      },
      orderBy: { approvedAt: "desc" },
    });

    const items = inspections.map((insp) => ({
      id: insp.id,
      inspectionId: insp.id,
      status: "PRONTO_PARA_GERAR",
      equipmentTag: insp.equipment.tag,
      equipmentType: insp.equipment.type,
      clientName: insp.equipment.client.companyName,
      approvedAt: insp.approvedAt?.toISOString() || null,
      inspectorName: insp.inspector.name,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao carregar inspeções prontas" }, { status: 500 });
  }
}