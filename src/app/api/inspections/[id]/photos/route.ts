import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStorage } from "@/modules/storage";

const VALID_CATEGORIES = [
  "PLACA", "CORROSAO", "VALVULA", "MANOMETRO",
  "ULTRASSOM", "VISTA_GERAL", "SOLDA", "TRINCA", "REPARO"
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const photos = await prisma.inspectionPhoto.findMany({
    where: { inspectionId: id },
    include: {
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ photos });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const category = formData.get("category") as string;
  const caption = formData.get("caption") as string;
  const order = parseInt(formData.get("order") as string) || 0;

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    select: { id: true, inspectorId: true },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Inspeção não encontrada." }, { status: 404 });
  }

  const canAddPhoto = inspection.inspectorId === session.userId ||
    session.role === "GESTOR" || session.role === "ADMIN_MASTER";

  if (!canAddPhoto) {
    return NextResponse.json({ error: "Sem permissão para adicionar fotos." }, { status: 403 });
  }

  const storage = process.env.BLOB_READ_WRITE_TOKEN ? await getStorage() : null;
  const createdPhotos = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    let url: string;
    if (storage) {
      // Upload to cloud storage
      const ext = file.name.split('.').pop() || 'jpg';
      const pathname = `inspections/${id}/${category.toLowerCase()}-${Date.now()}-${i}.${ext}`;
      const result = await storage.upload(file, pathname);
      url = result.url;
    } else {
      // Fallback placeholder (dev environment without storage configured)
      url = `https://placehold.co/800x600/1e293b/ffffff?text=${category}+${i}`;
    }

    const photo = await prisma.inspectionPhoto.create({
      data: {
        inspectionId: id,
        url,
        category: category as any,
        caption: caption || `${category} - ${file.name}`,
        order: order + i,
        uploadedById: session.userId,
      },
    });
    createdPhotos.push(photo);
  }

  return NextResponse.json({ photos: createdPhotos }, { status: 201 });
}
