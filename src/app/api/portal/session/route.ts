import { NextResponse } from "next/server";
import { getPortalSession } from "@/portal/lib/portal-auth";

export async function GET() {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ session: null }, { status: 200 });
  }

  return NextResponse.json({
    session: {
      clientId: session.clientId,
      name: session.name,
      role: session.role,
    },
  });
}