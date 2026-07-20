import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE } from "@/lib/auth";

// Protege todas as rotas do grupo (app) - dashboard, clientes,
// equipamentos etc. Roda no Edge Runtime, por isso usa jose
// diretamente (nao pode importar Prisma aqui).

const PUBLIC_PATHS = ["/login", "/cadastrar", "/esqueci-senha", "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/admin/seed"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
