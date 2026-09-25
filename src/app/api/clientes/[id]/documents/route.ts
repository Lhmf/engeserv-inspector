import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/modules/storage";

const validTypes = ["LAUDO", "ART", "INSPECAO", "OUTRO"] as const;

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await getSession()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const documents = await prisma.clientDocument.findMany({ where: { clientId: params.id }, include: { site: { select: { id: true, name: true } }, uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Armazenamento de documentos não está configurado." }, { status: 503 });
  const data = await req.formData();
  const file = data.get("file"); const type = data.get("type"); const siteId = data.get("siteId");
  if (!(file instanceof File) || !validTypes.includes(type as typeof validTypes[number])) return NextResponse.json({ error: "Informe o tipo e selecione um arquivo." }, { status: 400 });
  const client = await prisma.client.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  if (siteId && typeof siteId === "string") { const site = await prisma.clientSite.findFirst({ where: { id: siteId, clientId: client.id } }); if (!site) return NextResponse.json({ error: "Frente inválida para este cliente." }, { status: 400 }); }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `clients/${client.id}/documents/${Date.now()}-${safeName}`;
  const upload = await (await getStorage()).upload(file, storedName);
  const document = await prisma.clientDocument.create({ data: { clientId: client.id, siteId: typeof siteId === "string" && siteId ? siteId : null, type: type as typeof validTypes[number], originalName: file.name, storedName: upload.pathname, url: upload.url, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, uploadedById: session.userId } });
  return NextResponse.json({ document }, { status: 201 });
}
