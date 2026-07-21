import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const templates = await prisma.textTemplate.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { code, title, content, category } = body;

  if (!code || !title || !content) {
    return NextResponse.json({ error: "Código, título e conteúdo são obrigatórios." }, { status: 400 });
  }

  const existing = await prisma.textTemplate.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) {
    return NextResponse.json({ error: "Já existe um texto com este código." }, { status: 409 });
  }

  const template = await prisma.textTemplate.create({
    data: {
      code: code.toUpperCase(),
      title,
      content,
      category: category || "RECOMENDACAO",
      active: true,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}