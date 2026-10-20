/**
 * Testes de segurança — sessão do Portal e regras de login.
 * Runner: node:test nativo. Executar com:
 *   npx tsx src/portal/lib/__tests__/portal-auth.security.test.ts
 */
process.env.AUTH_SECRET = "security-test-secret-for-portal-auth-only-0001";
process.env.POSTGRES_URL = "postgresql://localhost:5432/security_test";

import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";

import {
  signPortalSession,
  verifyPortalSession,
  selectLoginClient,
  type LoginCandidate,
} from "../portal-auth";
import {
  INTERNAL_SESSION_AUDIENCE,
  INTERNAL_SESSION_ISSUER,
  PORTAL_SESSION_AUDIENCE,
  PORTAL_SESSION_ISSUER,
} from "../portal-session-claims";
import {
  isInspectionVisibleToPortal,
  isReportVisibleToPortal,
} from "../portal-visible-states";
import { verifySessionToken } from "../../../lib/auth";

const SECRET_KEY = new TextEncoder().encode(process.env.AUTH_SECRET);

async function signManual(payload: Record<string, unknown>, opts?: { expired?: boolean }) {
  let jwt = new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt();
  if (opts?.expired) {
    jwt = jwt.setIssuer(PORTAL_SESSION_ISSUER)
      .setAudience(PORTAL_SESSION_AUDIENCE)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600);
  } else {
    jwt = jwt.setExpirationTime("60s");
  }
  return jwt.sign(SECRET_KEY);
}

const clientes: LoginCandidate[] = [
  { id: "c_a", companyName: "Prando Engenharia Ltda", cnpj: "12.345/6780001-90", contactName: "João Prando" },
  { id: "c_b", companyName: "Construtora Prando", cnpj: "12345678000110", contactName: null },
  { id: "c_outro", companyName: "Almeida Obras", cnpj: "99999999000100", contactName: null },
];

test("verifyPortalSession aceita token emitido pelo Portal (roundtrip)", async () => {
  const token = await signPortalSession({ clientId: "c1", name: "Prando" });
  const session = await verifyPortalSession(token);
  assert.ok(session);
  assert.equal(session.clientId, "c1");
  assert.equal(session.name, "Prando");
  assert.equal(session.role, "CLIENTE");
});

test("verifyPortalSession REJEITA token sem issuer/audience (estilo interno antigo)", async () => {
  const token = await signManual({ clientId: "c1", name: "Prando", role: "CLIENTE" });
  assert.equal(await verifyPortalSession(token), null);
});

test("verifyPortalSession REJEITA token com issuer/audience internos", async () => {
  const token = await new SignJWT({ clientId: "c1", name: "Prando", role: "CLIENTE" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(INTERNAL_SESSION_ISSUER)
    .setAudience(INTERNAL_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(SECRET_KEY);
  assert.equal(await verifyPortalSession(token), null);
});

test("verifyPortalSession REJEITA token expirado", async () => {
  const token = await signManual({}, { expired: true });
  assert.equal(await verifyPortalSession(token), null);
});

test("verifyPortalSession REJEITA payload sem clientId estruturado", async () => {
  const semClientId = await new SignJWT({ name: "Prando", role: "CLIENTE", iss: PORTAL_SESSION_ISSUER, aud: PORTAL_SESSION_AUDIENCE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(SECRET_KEY);
  assert.equal(await verifyPortalSession(semClientId), null);

  const roleErrado = await new SignJWT({ clientId: "c1", name: "Prando", role: "GESTOR", iss: PORTAL_SESSION_ISSUER, aud: PORTAL_SESSION_AUDIENCE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(SECRET_KEY);
  assert.equal(await verifyPortalSession(roleErrado), null);
});

test("sessão interna rejeita token do Portal e aceita token interno", async () => {
  const portalToken = await signPortalSession({ clientId: "c1", name: "Prando" });
  assert.equal(await verifySessionToken(portalToken), null);

  const interno = await new SignJWT({
    userId: "u1",
    name: "Gestor Um",
    email: "g@engeserv.local",
    role: "GESTOR",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(INTERNAL_SESSION_ISSUER)
    .setAudience(INTERNAL_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(SECRET_KEY);
  const sessao = await verifySessionToken(interno);
  assert.ok(sessao);
  assert.equal(sessao.userId, "u1");
  assert.equal(sessao.role, "GESTOR");

  const internoSemRoleValida = await new SignJWT({
    userId: "u1",
    name: "X",
    email: "x@e.local",
    role: "SUPER_ADMIN",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(INTERNAL_SESSION_ISSUER)
    .setAudience(INTERNAL_SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(SECRET_KEY);
  assert.equal(await verifySessionToken(internoSemRoleValida), null);
});

test("selectLoginClient: match único (case-insensitive, CNPJ com máscara)", () => {
  const r = selectLoginClient("prando", "12345678000190", clientes);
  assert.equal(r.kind, "match");
  if (r.kind === "match") assert.equal(r.client.id, "c_a");
});

test("selectLoginClient: aceita nome via contactName", () => {
  const r = selectLoginClient("joão", "12345678000190", clientes);
  assert.equal(r.kind, "match");
});

test("selectLoginClient: prefixo com dono único mas nome errado → name_mismatch (nunca autentica outro)", () => {
  const r = selectLoginClient("almeida", "12345678000190", clientes);
  assert.equal(r.kind, "name_mismatch");
});

test("selectLoginClient: CNPJ sem candidato → not_found", () => {
  const r = selectLoginClient("prando", "77777777000100", clientes);
  assert.equal(r.kind, "not_found");
});

test("selectLoginClient: dois candidatos com mesmo prefixo e nomes compatíveis → ambiguous", () => {
  const duplicados: LoginCandidate[] = [
    { id: "c1", companyName: "Prando Engenharia", cnpj: "12345678000190", contactName: null },
    { id: "c2", companyName: "Prando Obras", cnpj: "12345678000111", contactName: null },
  ];
  const r = selectLoginClient("prando", "12345678000190", duplicados);
  assert.equal(r.kind, "ambiguous");
});

test("selectLoginClient: prefixo compartilhado resolve pelo nome (2º cliente da lista, correção de colisão)", () => {
  // Antes: find() considerava só o 1º cliente com o prefixo (c_a) e falhava para c_b.
  const r = selectLoginClient("construtora", "12345678000110", clientes);
  assert.equal(r.kind, "match");
  if (r.kind === "match") assert.equal(r.client.id, "c_b");
});

test("selectLoginClient: campos inválidos → recusa", () => {
  // Nome vazio nunca casa com candidato: recusado como name_mismatch (sem match).
  assert.equal(selectLoginClient("   ", "12345678000190", clientes).kind, "name_mismatch");
  assert.equal(selectLoginClient("prando", "123456", clientes).kind, "match"); // exatamente 6 dígitos ok
  assert.equal(selectLoginClient("prando", "12345", clientes).kind, "not_found");
});

test("estados visíveis: DRAFT/REJEITADOS/EM_ANDAMENTOS nunca visíveis", () => {
  for (const s of ["DRAFT", "UNDER_REVIEW", "REJECTED", "ARCHIVED", ""]) {
    assert.equal(isReportVisibleToPortal(s), false, `laudo ${s}`);
  }
  for (const s of ["APPROVED", "PUBLISHED"]) {
    assert.equal(isReportVisibleToPortal(s), true, `laudo ${s}`);
  }
  for (const s of ["EM_ANDAMENTO", "AGUARDANDO_APROVACAO", "REJEITADA"]) {
    assert.equal(isInspectionVisibleToPortal(s), false, `inspeção ${s}`);
  }
  assert.equal(isInspectionVisibleToPortal("APROVADA"), true);
});
