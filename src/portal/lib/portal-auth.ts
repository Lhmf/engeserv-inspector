import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

const COOKIE_NAME = "portal_session";
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

/**
 * Verifica o token do cookie portal_session e retorna o payload.
 * Retorna null se não houver token ou se for inválido.
 */
export async function verifyPortalSession(token: string): Promise<PortalSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as PortalSession;
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
  cnpj: string
): Promise<{ success: true; clientId: string; name: string } | { success: false; error: string }> {
  // 1. Remover máscara do CNPJ (manter apenas dígitos)
  const cnpjLimpo = cnpj.replace(/\D/g, "");
  if (cnpjLimpo.length < 6) {
    return { success: false, error: "CNPJ inválido." };
  }
  // Os 6 primeiros dígitos do CNPJ (posições 0-5)
  const cnpjPrefixo = cnpjLimpo.substring(0, 6);

  // 2. Buscar cliente no banco cujo CNPJ termine com aqueles 6 dígitos
  // Como o CNPJ no banco pode vir com máscara ou limpo, fazemos um match pelo final.
  // Usamos o SQLite/Postgres: o campo cnpj pode ter formatação variada.
  // A estratégia: remover máscara do lado do banco também ou comparar o prefixo.
  // Como não sabemos o formato exato guardado, faremos uma busca flexível:
  // - Tentar clientes onde o CNPJ limpo termine com cnpjPrefixo
  // - Ou onde contenha esse prefixo (para casos de CNPJ longo vs curto).

  let client: any = null;

  // Abordagem: buscar cliente onde o CNPJ (limpo) termine com o prefixo informado
  // Prisma: usamos o operador `endsWith` se o banco estiver limpo, ou fazemos comparação manual.
  // Para ser seguro, vamos buscar todos os clientes ativos e filtrar do lado do código,
  // ou usar o where do Prisma com operador apropriado.

  // Como o schema do Prisma tem cnpj como String? (nullable), vamos tentar uma busca flexível:
  // Primeiro, tentar encontrar clientes ativos e verificar cada cnpj do lado do cliente.
  // Como pode haver muitos clientes, vamos tentar uma abordagem de where primeiro.

  // O Prisma não tem endsWith nativo fácil, então vamos buscar clientes e filtrar.
  // Mas para performance, vamos tentar usar o where da forma mais específica que o Prisma permite.
  // Como o cnpj no banco pode vir formatado (com pontos/slash), vamos tentar comparar após remover máscara.

  // Abordagem prática: listar clientes e filtrar no código.
  // Como esta é a Fase 1 e o número de clientes deve ser pequeno (até 5 usuários simultâneos
  // conforme PROJECT_RULES.md), listar todos é aceitável.

  const allClients = await prisma.client.findMany({
    where: { active: true },
    select: { id: true, companyName: true, cnpj: true, contactName: true },
  });

  // Filtrar clientes cujo CNPJ (limpo) comece com o prefixo informado
  // (ou contenha, dependendo do que vier do banco).
  const clienteEncontrado = allClients.find((c) => {
    const cnpjLimpoDoBanco = (c.cnpj || "").replace(/\D/g, "");
    // Verificar se o CNPJ do banco termina com o prefixo informado
    // (pois os 6 primeiros dígitos do CNPJ identificam a empresa)
    return cnpjLimpoDoBanco.endsWith(cnpjPrefixo);
  });

  if (!clienteEncontrado) {
    return { success: false, error: "Credenciais inválidas. Verifique o nome e o CNPJ." };
  }

  // 3. Validar nome: o primeiroNome deve estar no início da razão social
  const nomeNormalizado = primeiroNome.trim().toLowerCase();
  const razaoSocialNormalizada = (clienteEncontrado.companyName || "").toLowerCase();
  const contatoNormalizado = (clienteEncontrado.contactName || "").toLowerCase();

  // Aceitar se o primeiroNome bater com o início da companyName Ou com o contactName
  const nomeBate =
    razaoSocialNormalizada.startsWith(nomeNormalizado) ||
    contatoNormalizado.startsWith(nomeNormalizado);

  if (!nomeBate) {
    return { success: false, error: "Nome do cliente não corresponde ao cadastro. Verifique se digitou o primeiro nome corretamente." };
  }

  // 4. Criar sessão portal
  await createPortalSession({
    clientId: clienteEncontrado.id,
    name: primeiroNome.trim(),
  });

  return { success: true, clientId: clienteEncontrado.id, name: primeiroNome.trim() };
}