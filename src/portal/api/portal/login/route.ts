import { NextRequest, NextResponse } from "next/server";
import { portalLogin } from "@/portal/lib/portal-auth";
import { getRequestIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { primeiroNome, cnpj } = body;

    if (!primeiroNome || !cnpj) {
      return NextResponse.json(
        { error: "Informe o primeiro nome e o CNPJ." },
        { status: 400 }
      );
    }

    const result = await portalLogin(primeiroNome, cnpj, getRequestIp(req));

    if (result.success) {
      return NextResponse.json({
        success: true,
        clientId: result.clientId,
        name: result.name,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }
  } catch (err: any) {
    console.error("[PORTAL_LOGIN_ERROR]", err?.message ?? err);
    return NextResponse.json(
      { error: "Não foi possível processar o login." },
      { status: 503 }
    );
  }
}
