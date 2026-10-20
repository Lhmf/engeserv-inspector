import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PORTAL_SESSION_COOKIE } from "@/portal/lib/portal-session-claims";

// Rota invocada por POST do PortalNavigation; cookie único compartilhado
// com a emissão (portal-auth) e validação (middleware).
export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete(PORTAL_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
