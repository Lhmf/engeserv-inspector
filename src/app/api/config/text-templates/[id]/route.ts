import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const template = await prisma.textTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return NextResponse.json({ error: "Texto padrão não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { code, title, content, category, active } = body;

  const existing = await prisma.textTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Texto padrão não encontrado." }, { status: 404 });
  }

  if (code && code !== existing.code) {
    const conflict = await prisma.textTemplate.findUnique({ where: { code } });
    if (conflict) {
      return NextResponse.json({ error: "Já existe um texto com este código." }, { status: 409 });
    }
  }

  const template = await prisma.textTemplate.update({
    where: { id },
    data: {
      code: code?.toUpperCase() ?? existing.code,
      title: title ?? existing.title,
      content: content ?? existing.content,
      category: category ?? existing.category,
      active: active ?? existing.active,
    },
  });

  return NextResponse.json({ template });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.textTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Texto padrão não encontrado." }, { status: 404 });
  }

  await prisma.textTemplate.delete({ where: { id } });

  return NextResponse.json({ message: "Texto padrão excluído com sucesso." });
}