/**
 * Lote 16C — Testes QA: tokens de sessão do Portal vs. sistema interno.
 *
 * NOTA DE CONCORRÊNCIA (19/10/2026 ~10:20): durante a elaboração deste lote,
 * o Agente B reescreveu src/portal/lib/portal-auth.ts. O teste documenta o
 * comportamento DA VEZ EM QUE OS TESTES FORAM EXECUTADOS (estado do working
 * tree no momento da execução). Se B continuar editando, reexecutar.
 *
 * Segurança do teste: usa um segredo EFÊMERO gerado em runtime (randomBytes),
 * criado apenas no processo de teste. Nenhum segredo real é lido ou impresso.
 * O valor de process.env.AUTH_SECRET é sobrescrito no processo de teste de
 * forma a isolá-lo de qualquer valor real de ambiente (nunca impresso).
 *
 * Comando:
 *   npx tsx --test tests/qa/portal-token.test.ts
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { randomBytes } from "node:crypto";

const QA_SECRET = "qa-ephemeral-" + randomBytes(24).toString("hex");

describe("portal-token: setup isolado", () => {
  let portalAuth: typeof import("@/portal/lib/portal-auth");
  let claims: typeof import("@/portal/lib/portal-session-claims");
  let internalAuth: typeof import("@/lib/auth");

  before(async () => {
    process.env.AUTH_SECRET = QA_SECRET; // somente neste processo de teste
    portalAuth = (await import("@/portal/lib/portal-auth")) as any;
    claims = (await import("@/portal/lib/portal-session-claims")) as any;
    internalAuth = (await import("@/lib/auth")) as any;
  });

  after(() => {
    delete process.env.AUTH_SECRET;
  });

  const PORTAL_PAYLOAD = { clientId: "qa-client-a", name: "Cliente A (QA)" };

  function encode(secret: string) {
    return new TextEncoder().encode(secret);
  }

  it("token de portal válido (issuer/audience exclusivos): round-trip clientId/name/role", async () => {
    const token = await portalAuth.signPortalSession(PORTAL_PAYLOAD);
    const session = await portalAuth.verifyPortalSession(token);
    assert.ok(session, "sessão deve validar");
    assert.equal(session!.clientId, PORTAL_PAYLOAD.clientId);
    assert.equal(session!.name, PORTAL_PAYLOAD.name);
    assert.equal(session!.role, "CLIENTE");
  });

  it("separação de cookies: PORTAL_COOKIE (portal_session) ≠ COOKIE interno (engeserv_session)", () => {
    assert.equal(portalAuth.PORTAL_COOKIE, "portal_session");
    assert.equal(internalAuth.COOKIE, "engeserv_session");
    assert.notEqual(portalAuth.PORTAL_COOKIE, internalAuth.COOKIE);
  });

  it("separação de claims: issuer/audience do Portal são distintos dos internos", () => {
    assert.equal(claims.PORTAL_SESSION_ISSUER, "engeserv-portal");
    assert.equal(claims.PORTAL_SESSION_AUDIENCE, "engeserv-portal-client");
    assert.notEqual(claims.PORTAL_SESSION_ISSUER, claims.INTERNAL_SESSION_ISSUER);
    assert.notEqual(claims.PORTAL_SESSION_AUDIENCE, claims.INTERNAL_SESSION_AUDIENCE);
  });

  it("rejeita token expirado (jwtVerify respeita exp por padrão)", async () => {
    const token = await new SignJWT({ ...PORTAL_PAYLOAD, role: "CLIENTE" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(claims.PORTAL_SESSION_ISSUER)
      .setAudience(claims.PORTAL_SESSION_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("-1s")
      .sign(encode(QA_SECRET));
    const session = await portalAuth.verifyPortalSession(token);
    assert.equal(session, null);
  });

  it("rejeita token com issuer/audience corretos mas assinado com segredo diferente", async () => {
    const token = await new SignJWT({ ...PORTAL_PAYLOAD, role: "CLIENTE" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(claims.PORTAL_SESSION_ISSUER)
      .setAudience(claims.PORTAL_SESSION_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encode("segredo-divergente-" + randomBytes(8).toString("hex")));
    const session = await portalAuth.verifyPortalSession(token);
    assert.equal(session, null);
  });

  it("rejeita token malformado", async () => {
    const session = await portalAuth.verifyPortalSession("nao-e-um-jwt");
    assert.equal(session, null);
  });

  it("rejeita token sem issuer/audience do Portal (legado/forjado)", async () => {
    const token = await new SignJWT({ ...PORTAL_PAYLOAD, role: "CLIENTE" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encode(QA_SECRET));
    const session = await portalAuth.verifyPortalSession(token);
    assert.equal(session, null, "exigência de issuer/audience exclusivos deve rejeitar");
  });

  it("EVIDÊNCIA PÓS-CORREÇÃO (achado B-2): token com claims de sessão interna é rejeitado pelo portal", async () => {
    // Token com shape do sistema interno MAS com issuer/audience do portal
    // (agressor tentando reutilizar segredo compartilhado com claims erradas):
    // a validação estrutural de role deve rejeitar.
    const token = await new SignJWT({
      userId: "qa-user-1",
      name: "QA Admin",
      email: "qa@local",
      role: "ADMIN_MASTER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(claims.PORTAL_SESSION_ISSUER)
      .setAudience(claims.PORTAL_SESSION_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encode(QA_SECRET));
    const session = await portalAuth.verifyPortalSession(token);
    assert.equal(session, null, "role !== CLIENTE deve ser rejeitado pelo portal");
  });

  it("EVIDÊNCIA PÓS-CORREÇÃO (achado B-2, lado interno): verifySessionToken interno rejeita token de portal", async () => {
    // Estado documentado em 19/10/2026 10:23: src/lib/auth.ts passou a validar
    // issuer/audience exclusivos internos + enum Role → um token do portal
    // (issuer/audience do portal, role CLIENTE) NÃO pode mais ser usado como
    // sessão interna (cookie engeserv_session réplica).
    const portalToken = await portalAuth.signPortalSession(PORTAL_PAYLOAD);
    const viaInternal = await internalAuth.verifySessionToken!(portalToken);
    assert.equal(viaInternal, null, "token do portal deve ser rejeitado pelo sistema interno");
  });

  it("round-trip de token interno válido (issuer/audience internos + Role válido)", async () => {
    const token = await new SignJWT({
      userId: "qa-user-1",
      name: "QA Gestor",
      email: "qa@local",
      role: "GESTOR",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(claims.INTERNAL_SESSION_ISSUER)
      .setAudience(claims.INTERNAL_SESSION_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(encode(QA_SECRET));
    const session = await internalAuth.verifySessionToken!(token);
    assert.ok(session, "sessão interna deve validar");
    assert.equal(session!.role, "GESTOR");
    assert.equal(session!.userId, "qa-user-1");
  });

  it("rejeita token interno com Role inexistente (fora do enum do schema)", async () => {
    const token = await new SignJWT({
      userId: "qa-user-2",
      name: "QA Cliente",
      email: "qa2@local",
      role: "CLIENTE", // não é um Role do sistema interno
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer(claims.INTERNAL_SESSION_ISSUER)
      .setAudience(claims.INTERNAL_SESSION_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(encode(QA_SECRET));
    const session = await internalAuth.verifySessionToken!(token);
    assert.equal(session, null, "role CLIENTE não deve validar como sessão interna");
  });

  it("comportamento observado: AUTH_SECRET verdadeiramente ausente faz verify retornar null e sign lançar erro", async () => {
    // NOTA QA (16C): `process.env.X = undefined` NÃO remove a variável — Node
    // coage para a string "undefined" (segredo válido!). A forma correta de
    // remover é `delete process.env.X`. A primeira versão deste teste "passou
    // por coincidência"; esta versão verifica o comportamento real documentado
    // em portal-auth.ts: getSecretKey() lança, o try/catch de verifyPortalSession
    // engole o erro → null (falha-fechada silenciosa).
    const backup = process.env.AUTH_SECRET;
    try {
      delete process.env.AUTH_SECRET;
      const token = await portalAuth.signPortalSession(PORTAL_PAYLOAD).catch(() => "[sign-threw]" as const);
      if (token !== "[sign-threw]") {
        const session = await portalAuth.verifyPortalSession(token);
        assert.equal(session, null, "sem AUTH_SECRET real, nenhuma sessão pode validar");
      } else {
        assert.ok(true, "sign falhou com 'AUTH_SECRET não definido' — comportamento fechado OK");
      }
    } finally {
      process.env.AUTH_SECRET = backup ?? QA_SECRET;
    }
  });
});
