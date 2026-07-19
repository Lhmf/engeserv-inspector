import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ================================================================
// Camada de autenticacao (isolada da interface, conforme
// PROJECT_RULES.md: "Nunca misturar regra de negocio com interface").
//
// Estrategia: sessao via cookie httpOnly assinado (JWT), sem
// dependencia de provedores externos. Simples de rodar local e na
// Vercel (edge-compatible via `jose`), sem exigir banco de sessao.
// ================================================================

export type Role = "ADMIN_MASTER" | "GESTOR" | "FUNCIONARIO";

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  role: Role;
};

const COOKIE_NAME = "engeserv_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET nao definido. Configure o arquivo .env.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function destroySession() {
  cookies().delete(COOKIE_NAME);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Le a sessao atual a partir dos cookies da requisicao (Server Components / Route Handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const COOKIE = COOKIE_NAME;

// ---------------- Regras de permissao (Modulo Autenticacao) ----------------
// Conforme docs/PROJECT_RULES.md:
//  - Funcionario: cadastra cliente/equipamento, cria inspecao, lanca
//    medicoes, anexa fotos, preenche checklist.
//  - Funcionario NAO PODE: gerar laudo definitivo, alterar formulas,
//    excluir inspecoes, aprovar inspecoes.
//  - Gestor: revisa, aprova, assina, gera PDF/Word, edita conclusao,
//    libera o documento. Tambem cria contas de Funcionario.
//  - Admin Master: unico que cria contas de Gestor. Acesso total.

export function canCreateGestor(role: Role) {
  return role === "ADMIN_MASTER";
}

export function canCreateFuncionario(role: Role) {
  return role === "ADMIN_MASTER" || role === "GESTOR";
}

export function canApproveInspection(role: Role) {
  return role === "GESTOR" || role === "ADMIN_MASTER";
}

export function canIssueFinalReport(role: Role) {
  return role === "GESTOR" || role === "ADMIN_MASTER";
}
