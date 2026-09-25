import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().trim().min(2).max(120), address: z.string().trim().max(500).optional() });

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await getSession()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const sites = await prisma.clientSite.findMany({ where: { clientId: params.id }, orderBy: { name: "asc" } });
  return NextResponse.json({ sites });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await getSession()) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados da frente inválidos." }, { status: 400 });
  const client = await prisma.client.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  try {
    const site = await prisma.clientSite.create({ data: { clientId: client.id, ...parsed.data } });
    return NextResponse.json({ site }, { status: 201 });
  } catch { return NextResponse.json({ error: "Já existe uma frente com este nome." }, { status: 409 }); }
}
