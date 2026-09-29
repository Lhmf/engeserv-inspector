import { NextRequest, NextResponse } from "next/server";
import { verifyPortalSession } from "@/portal/lib/portal-auth";

// Rotas públicas do portal (não exigem autenticação)
// Estas rotas podem ser acessadas sem login (ex: página de login itself)
const PORTAL_PUBLIC_PATHS = ["/portal/login"];

// Rotas e arquivos estáticos que não exigem autenticação do portal
const PORTAL_PUBLIC_ASSETS = [
  "/_next",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Se for um ativo público, permitir acesso livre
  if (PORTAL_PUBLIC_ASSETS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Se for uma rota pública do portal (ex: /portal/login), permitir
  if (PORTAL_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Para todas as outras rotas do portal, exigir autenticação
  if (pathname.startsWith("/portal")) {
    // Extrair token do cookie portal_session
    const token = req.cookies.get("portal_session")?.value;
    if (!token) {
      // Nenhum token → redirecionar para login
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }

    try {
      const session = await verifyPortalSession(token);
      if (!session) {
        // Token inválido → redirecionar para login
        return NextResponse.redirect(new URL("/portal/login", req.url));
      }
      // Session válida — permitir acesso e anexar informações ao request
      // Podemos criar uma resposta nova e adicionar headers ou usar NextResponse.next()
      // Como o Next.js middleware não pode passar dados para componentes da mesma forma,
      // confiaremos de que as rotas handler verificarão a sessão novamente ou
      // que o próprio Next.js fará o gerenciamento de estado. Para este MVP,
      // basta garantir que o token é válido e prosseguir.
      return NextResponse.next();
    } catch (err) {
      console.error("[PORTAL_MIDDLEWARE_VERIFY_ERROR]", err);
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
  }

  // Rota não é do portal, deixar prosseguir normalmente
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:*", "/api/portal/:*"],
};