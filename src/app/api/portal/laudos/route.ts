import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { PORTAL_VISIBLE_REPORT_STATUSES } from "@/portal/lib/portal-visible-states";
import { prisma } from "@/lib/prisma";

// Rota protegida por cookie de sessão: nunca prerender e produzir
// logs falsos de "Dynamic server usage" durante o build.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Visibilidade: apenas laudos APROVADOS/PUBLICADOS pela EngeServ
    // (DRAFT/UNDER_REVIEW/REJECTED/ARCHIVED nunca são expostos).
    const technicalReports = await prisma.technicalReport.findMany({
      where: {
        status: { in: PORTAL_VISIBLE_REPORT_STATUSES },
        inspection: {
          equipment: {
            clientId: session.clientId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        inspection: {
          select: {
            equipment: {
              select: {
                tag: true,
                type: true,
                id: true,
              },
            },
          },
        },
      },
    });

    const laudos = technicalReports.map((r) => ({
      id: r.id,
      reportNumber: r.reportNumber,
      version: r.version,
      status: r.status,
      equipmentTag: r.inspection?.equipment?.tag || "N/A",
      equipmentType: r.inspection?.equipment?.type || "N/A",
      equipmentId: r.inspection?.equipment?.id || null,
      inspectionDate: r.inspectionDate.toISOString().split("T")[0],
      issuedAt: r.issuedAt?.toISOString().split("T")[0] || null,
      expiresAt: r.expiresAt?.toISOString().split("T")[0] || null,
      vigente: !!(r.expiresAt && new Date(r.expiresAt) > new Date()),
    }));

    return NextResponse.json({ laudos });
  } catch (err: any) {
    console.error("[PORTAL_LAUDOS_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}