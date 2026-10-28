import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  PORTAL_SESSION_AUDIENCE,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_ISSUER,
} from "@/portal/lib/portal-session-claims";
import { clearRateLimit, isRateLimited, registerFailure } from "@/lib/rate-limit";

// ================================================================
// Autenticação de cliente para o Portal do EngeServ.
// Reutiliza o mesmo AUTH_SECRET do sistema interno, mas usa
// cookie separado (portal_session) e claims de cliente.
// NUNCA confiar em clientId vindo do frontend — o clientId virá
// sempre da sessão validada no backend.
// ================================================================

export type PortalSession = {
  clientId: string;
  name: string;
  role: "CLIENTE";
};

const COOKIE_NAME = PORTAL_SESSION_COOKIE;
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não definido. Configure o arquivo .env.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Cria um cookie de sessão para o cliente portal.
 * Use esta função após validar o CNPJ + nome no banco.
 */
export async function createPortalSession(payload: { clientId: string; name: string }) {
  const token = await signPortalSession(payload);

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/** Assina o JWT do Portal com issuer/audience exclusivos (testável sem request scope). */
export async function signPortalSession(payload: { clientId: string; name: string }) {
  return new SignJWT({ ...payload, role: "CLIENTE" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(PORTAL_SESSION_ISSUER)
    .setAudience(PORTAL_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

/**
 * Verifica o token do cookie portal_session e retorna o payload.
 * Retorna null se não houver token ou se for inválido.
 *
 * Regras reforçadas:
 * - Exige issuer/audience EXCLUSIVOS do Portal → um token do sistema
 *   interno (não assinado com essas claims) é rejeitado aqui.
 * - Valida a estrutura do payload (clientId/name/role) antes de confiar.
 */
export async function verifyPortalSession(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: PORTAL_SESSION_ISSUER,
      audience: PORTAL_SESSION_AUDIENCE,
    });

    // Validação estrutural: nunca confiar em cast direto do payload.
    const raw = payload as Record<string, unknown>;
    if (typeof raw.clientId !== "string" || raw.clientId.length === 0) return null;
    if (typeof raw.name !== "string") return null;
    if (raw.role !== "CLIENTE") return null;

    return { clientId: raw.clientId, name: raw.name, role: "CLIENTE" };
  } catch {
    return null;
  }
}

/** Lê a sessão atual a partir do cookie portal_session (Server Components / Route Handlers). */
export async function getPortalSession(): Promise<PortalSession | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Alias para getPortalSession - mantido para compatibilidade com nomenclatura da auditoria. */
export async function verifySessionToken(token: string): Promise<PortalSession | null> {
  return verifyPortalSession(token);
}

export const PORTAL_COOKIE = COOKIE_NAME;

/**
 ---------------------------------------------------------------
  LOGIN DE CLIENTE
  ---------------------------------------------------------------

  Regras de negócio:
  - Usuário: primeiro nome do cliente (ex: "Prando" de "Prando Engenharia")
  - Senha inicial: 6 primeiros dígitos do CNPJ (apenas números, sem máscara)
  - O backend deve:
    1. Remover máscara do CNPJ (apenas números)
    2. Buscar no banco o Cliente cujo CNPJ termine com aqueles 6 dígitos
    3. Normalizar o nome: o firstname fornecido deve estar no início
       da razão social do cliente (ignorar maiúsculas/minúsculas)
    4. Se válido, criar sessão com clientId + name + role: "CLIENTE"
  - Essa credencial é apenas inicial — futuramente permitirá:
    * troca de senha
    * recuperação de senha
    * autenticação própria
    * eventualmente 2FA
  - A senha NÃO deve ser armazenada em texto puro no frontend.
 ---------------------------------------------------------------*/

/**
 * Valida as credenciais de login do cliente e, se válidas,
 * cria uma sessão portal.
 *
 * Dados de entrada esperados (do frontend):
 *   - primeiroNome: string (ex: "Prando")
 *   - cnpj: string (com ou sem máscara, ex: "12.345.678/0001-90" ou "12345678000190")
 *
 * Retorna { success: true, clientId, name } ou { success: false, error }.
 */
export async function portalLogin(
  primeiroNome: string,
  cnpj: string,
  requestKey = "unknown"
): Promise<{ success: true; clientId: string; name: string } | { success: false; error: string }> {
  const genericError = "Credenciais inválidas. Verifique o nome e o CNPJ.";
  const accountKey = `${requestKey}:${String(primeiroNome).trim().toLowerCase()}:${String(cnpj).replace(/\D/g, "").slice(0, 6)}`;
  if (isRateLimited(requestKey) || isRateLimited(accountKey)) return { success: false, error: genericError };
  // 0. Validação de tipo/campo — evita estourar 500 com payload malformado.
  if (typeof primeiroNome !== "string" || typeof cnpj !== "string") {
    registerFailure(requestKey); registerFailure(accountKey);
    return { success: false, error: genericError };
  }
  if (primeiroNome.trim().length === 0 || primeiroNome.trim().length > 120) {
    return { success: false, error: "Credenciais inválidas. Verifique o nome e o CNPJ." };
  }

  // 1. Remover máscara do CNPJ (manter apenas dígitos)
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length < 6) {
    registerFailure(requestKey); registerFailure(accountKey);
    return { success: false, error: genericError };
  }

  // 2. Buscar clientes ativos e delegar a seleção a uma função pura e testável.
  const allClients = await prisma.client.findMany({
    where: { active: true },
    select: { id: true, companyName: true, cnpj: true, contactName: true },
  });

  const selecao = selectLoginClient(primeiroNome, cnpjLimpo, allClients);

  // 4. Criar sessão portal apenas em caso de match inequívoco.
  if (selecao.kind !== "match") {
    if (selecao.kind === "ambiguous") {
      // Colisão de prefixo CNPJ + mesmo nome: sem informação suficiente para
      // desambiguar (a senha é o próprio prefixo). Recusa genérica, sem
      // revelar a existence de clientes; detalhe vai só para o log interno.
      console.warn(
        "[PORTAL_LOGIN] Prefixo de CNPJ ambíguo entre clientes ativos; login recusado."
      );
      registerFailure(requestKey); registerFailure(accountKey);
      return { success: false, error: genericError };
    }
    registerFailure(requestKey); registerFailure(accountKey);
    return { success: false, error: genericError };
  }

  const clienteEncontrado = selecao.client;
  const displayName = primeiroNome.trim();
  await createPortalSession({
    clientId: clienteEncontrado.id,
    name: displayName,
  });
  clearRateLimit(requestKey);
  clearRateLimit(accountKey);

  return { success: true, clientId: clienteEncontrado.id, name: displayName };
}

export type LoginCandidate = {
  id: string;
  companyName: string;
  cnpj: string | null;
  contactName: string | null;
};

export type LoginClientSelection =
  | { kind: "match"; client: LoginCandidate }
  | { kind: "not_found"; error: string }
  | { kind: "name_mismatch"; error: string }
  | { kind: "ambiguous" };

function normalizarDigitosCnpj(v: string | null | undefined): string {
  return (v || "").replace(/\D/g, "");
}

function nomeDoCandidatoBate(primeiroNome: string, c: LoginCandidate): boolean {
  const nomeNormalizado = primeiroNome.trim().toLowerCase();
  // Nome vazio/whitespace nunca casa (startsWith("") casaria com qualquer cliente).
  if (nomeNormalizado.length === 0) return false;
  const razaoSocial = (c.companyName || "").toLowerCase();
  const contato = (c.contactName || "").toLowerCase();
  return razaoSocial.startsWith(nomeNormalizado) || contato.startsWith(nomeNormalizado);
}

/**
 * Seleção pura do cliente no login inicial (testável, sem Prisma).
 *
 * Regras:
 * - Considera TODOS os clientes ativos que casem com o prefixo informado,
 *   não apenas o primeiro (corrige colisão de prefixos CNPJ).
 * - Exatamente 1 cliente com nome compatível → match.
 * - Nenhum candidato com o prefixo → not_found.
 * - Candidatos com prefixo mas nenhum nome compatível → name_mismatch.
 * - Candidatos com prefixo e MAIS de um nome compatível → ambiguous
 *   (não é possível distinguir quem é o dono do CNPJ informado).
 */
export function selectLoginClient(
  primeiroNome: string,
  cnpjLimpo: string,
  clients: LoginCandidate[]
): LoginClientSelection {
  if (cnpjLimpo.length < 6) {
    return { kind: "not_found", error: "CNPJ inválido." };
  }
  const cnpjPrefixo = cnpjLimpo.substring(0, 6);

  const candidatos = clients.filter((c) =>
    normalizarDigitosCnpj(c.cnpj).startsWith(cnpjPrefixo)
  );

  if (candidatos.length === 0) {
    return { kind: "not_found", error: "Credenciais inválidas. Verifique o nome e o CNPJ." };
  }

  const matches = candidatos.filter((c) => nomeDoCandidatoBate(primeiroNome, c));

  if (matches.length === 1) {
    return { kind: "match", client: matches[0] };
  }
  if (matches.length > 1) {
    return { kind: "ambiguous" };
  }
  return {
    kind: "name_mismatch",
    error: "Credenciais inválidas. Verifique o nome e o CNPJ.",
  };
}
