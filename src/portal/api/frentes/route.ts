import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const frentes = await prisma.clientSite.findMany({
      where: { clientId: session.clientId, active: true },
      include: {
        equipments: {
          where: { active: true },
          select: { id: true, tag: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const formatted = frentes.map((f) => ({
      id: f.id,
      name: f.name,
      address: f.address,
      equipmentsCount: f.equipments.length,
      equipments: f.equipments.map((e) => ({ id: e.id, tag: e.tag })),
    }));

    return NextResponse.json({ frentes: formatted });
  } catch (err: any) {
    console.error("[PORTAL_FRENTES_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno: " + (err?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}