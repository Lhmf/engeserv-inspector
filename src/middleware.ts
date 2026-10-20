import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE } from "@/lib/auth";
import {
  INTERNAL_SESSION_AUDIENCE,
  INTERNAL_SESSION_ISSUER,
  PORTAL_SESSION_AUDIENCE,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_ISSUER,
} from "@/portal/lib/portal-session-claims";

// Protege todas as rotas do grupo (app) - dashboard, clientes,
// equipamentos etc. Roda no Edge Runtime, por isso usa jose
// diretamente (nao pode importar Prisma aqui).

const PUBLIC_PATHS = ["/login", "/cadastrar", "/esqueci-senha", "/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/admin/seed", "/api/admin/create-user", "/api/debug/bcrypt-test-v2", "/portal/login", "/api/portal"];

// Cookie de sessão do Portal do Cliente. ATENÇÃO: este middleware roda no
// Edge Runtime e NÃO pode importar `portal-auth.ts` (ela importa Prisma).
// Por isso a verificação usa os MESMOS critérios declarados em
// src/portal/lib/portal-auth.ts, com os issuer/audience EXCLUSIVOS
// compartilhados via src/portal/lib/portal-session-claims.ts (arquivo sem
// dependências, seguro no Edge): cookie `portal_session`, JWT HS256
// assinado com AUTH_SECRET, expiração e claims validadas por `jwtVerify`.
// Sem isso, um token do sistema interno colado em `portal_session`
// passaria no middleware (as APIs do portal continuam rejeitando por
// conta própria, mas as páginas renderizariam shell vazio).
const PORTAL_LOGIN_PATH = "/portal/login";

// Assets públicos da PWA que NÃO exigem autenticação:
// manifest, service worker, ícones, favicon e arquivos estáticos raiz.
const PUBLIC_ASSETS = ["/manifest.json", "/sw.js", "/icons", "/favicon", "/screenshots", "/offline"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Proteção server-side das PÁGINAS do portal (/portal/**) ----
  // Requisito: APIs do portal (/api/portal/**) são propositalmente deixadas
  // de fora — elas retornam 401 em JSON via getPortalSession() em suas rotas
  // e redirecioná-las para HTML quebraria os fetchs client-side.
  if (pathname.startsWith("/portal")) {
    if (pathname === PORTAL_LOGIN_PATH || pathname.startsWith(PORTAL_LOGIN_PATH + "/")) {
      return NextResponse.next(); // pública — evita redirect circular
    }
    const portalToken = req.cookies.get(PORTAL_SESSION_COOKIE)?.value;
    if (!portalToken) {
      return NextResponse.redirect(new URL(PORTAL_LOGIN_PATH, req.url));
    }
    try {
      const secretEnv = process.env.AUTH_SECRET;
      if (!secretEnv) {
        // Sem segredo configurado, nenhum token pode ser confiado.
        return NextResponse.redirect(new URL(PORTAL_LOGIN_PATH, req.url));
      }
      const secret = new TextEncoder().encode(secretEnv);
      // Mesmos critérios de verifyPortalSession: assinatura HS256 com AUTH_SECRET,
      // expiração e issuer/audience exclusivos do Portal (jwtVerify rejeita
      // token expirado por padrão).
      await jwtVerify(portalToken, secret, {
        issuer: PORTAL_SESSION_ISSUER,
        audience: PORTAL_SESSION_AUDIENCE,
      });
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL(PORTAL_LOGIN_PATH, req.url));
    }
  }

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    PUBLIC_ASSETS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secretEnv = process.env.AUTH_SECRET;
    if (!secretEnv) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const secret = new TextEncoder().encode(secretEnv);
    // Issuer/audience exclusivos do sistema interno — mesmo critério de
    // verifySessionToken em src/lib/auth.ts. Um token do Portal colado no
    // cookie interno não abre as telas internas.
    await jwtVerify(token, secret, {
      issuer: INTERNAL_SESSION_ISSUER,
      audience: INTERNAL_SESSION_AUDIENCE,
    });
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
