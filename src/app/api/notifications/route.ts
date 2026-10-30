import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null) as { id?: string; all?: boolean } | null;
  if (body?.all) {
    await prisma.notification.updateMany({ where: { recipientId: session.userId, readAt: null }, data: { readAt: new Date() } });
  } else if (body?.id) {
    await prisma.notification.updateMany({ where: { id: body.id, recipientId: session.userId }, data: { readAt: new Date() } });
  } else {
    return NextResponse.json({ error: "Informe id ou all." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
