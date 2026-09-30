import { NextRequest, NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getPortalSession();

    if (!session?.clientId) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const documentos = await prisma.clientDocument.findMany({
      where: { clientId: session.clientId },
      include: {
        site: { select: { id: true, name: true } },
        uploadedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = documentos.map((d) => ({
      id: d.id,
      type: d.type,
      originalName: d.originalName,
      url: d.url,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      site: d.site?.name,
      uploadedBy: d.uploadedBy?.name,
      createdAt: d.createdAt.toISOString().split("T")[0],
    }));

    return NextResponse.json({ documentos: formatted });
  } catch (err: any) {
    console.error("[PORTAL_DOCUMENTOS_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Erro interno: " + (err?.message ?? "desconhecido") },
      { status: 500 }
    );
  }
}