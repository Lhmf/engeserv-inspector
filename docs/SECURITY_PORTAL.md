# SECURITY_PORTAL.md — Modelo de segurança do Portal do Cliente

> Estado da arte após Lotes 15B–17B. Mantido pelo Agente B (backend/auth).
> Este documento registra o que ESTÁ implementado (com evidência) e o que
> exige decisão de negócio/autorização. Não contém segredos.

## 1. Sessões e tokens

| Sistema | Cookie | Issuer | Audience | Duração |
|---|---|---|---|---|
| Portal do Cliente | `portal_session` | `engeserv-portal` | `engeserv-portal-client` | 30 dias |
| Sistema interno | `engeserv_session` | `engeserv-inspector` | `engeserv-inspector-app` | 8 horas |

- Ambos são JWT HS256 assinados com `AUTH_SECRET` (compartilhado), mas
  **nunca interoperam**: `verifyPortalSession` e `verifySessionToken`
  exigem issuer/audience exclusivos (`src/portal/lib/portal-session-claims.ts`,
  arquivo puro seguro para Edge Runtime — importado também por
  `src/middleware.ts`).
- Payload do Portal validado estruturalmente antes do uso (`clientId`
  string não-vazia, `name` string, `role === "CLIENTE"`). Payload interno
  valida `userId`/`email`/`role` contra o enum real.
- Cookie `httpOnly`, `secure` em produção, `sameSite: lax`.

## 2. Estados visíveis ao cliente (enums reais do schema Prisma)

Definidos em `src/portal/lib/portal-visible-states.ts`:

- **Laudos técnicos**: `APPROVED` (aprovado pelo Gestor, vigente) e
  `PUBLISHED` (liberado/documentado). O cliente NÃO vê: `DRAFT`,
  `UNDER_REVIEW`, `REJECTED`, `ARCHIVED`.
- **Inspeções**: apenas `APROVADA`. O cliente NÃO vê: `EM_ANDAMENTO`,
  `AGUARDANDO_APROVACAO`, `REJEITADA` (notas/recomendações de rascunho
  ficam internas).
- Aplicado em: `laudos`, `laudos/[id]`, `recomendacoes`,
  `equipamentos/[id]` (histórico + laudo anexado), `dashboard`.

### Pendências de decisão da EngeServ (não inventadas por IA)
1. **`ARCHIVED`**: laudo arquivado substituído por versão nova pode ser
   histórico legítimo para o cliente. Regra a definir com o responsável
   técnico; hoje permanece oculto (lado conservador).
2. **Notas/recomendações de inspeções APROVADA**: hoje o histórico de
   `equipamentos/[id]` expõe `notes`/`recommendations` de inspeções
   aprovadas ao próprio cliente. Se esses campos contêm redação interna,
   a decisão é da EngeServ: filtrar campos ou liberar.
3. **Periodicidade fixa em 12 meses** nas validades do portal — validação
   técnica NR-13 por categoria pendente (registrada também em docs/TODO.md).

## 3. Isolamento entre clientes

- `clientId` vem EXCLUSIVAMENTE do JWT validado no backend
  (`getPortalSession()`); nenhuma rota aceita `clientId` do body/query.
- Listagens: `where: { clientId: session.clientId }` (via relacionamento
  em laudos/recomendações). Detalhes (`[id]`): `findFirst` com cláusula
  composta id + clientId → 404 genérico se não pertence ao cliente.
- **Status de validação HTTP**: NÃO há teste HTTP executado entre dois
  clientes distintos. O isolamento está garantido por inspeção de código e
  testes unitários da camada de sessão. Teste HTTP (401/404 cross-client)
  permanece pendente para o Agente C/QA.

## 4. Rate limit do login — opções (NÃO implementado)

Restrição honesta: um contador **em memória** não oferece proteção
confiável em Vercel Functions (instâncias efêmeras e múltiplas regiões) —
não foi implementado nada que simule proteção. A credencial inicial
(6 primeiros dígitos do CNPJ + primeiro nome) tem espaço de busca pequeno:
sem limitador externo, força bruta é viável. Opções:

| Opção | Dependência | Efeito | Riscos/custos |
|---|---|---|---|
| A. Vercel KV / Upstash Redis (janela fixa por IP+prefixo CNPJ) | Serviço externo + variável de ambiente (requer autorização) | Limite global real (ex.: 5 tentativas/15 min) | Latência, custo, quota free tier |
| B. Middleware com `@upstash/ratelimit` | idem | Idem A, bloqueia antes da rota | idem |
| C. Bloqueio progressivo por cliente no banco (coluna `login_lock_*` no Client) | **Migration no schema** (requer autorização) | Persistente, independente de região | Migration + lógica de desbloqueio |
| D. Substituir a credencial inicial por senha com hash (bcrypt) | Migration (coluna `portalPasswordHash`) | Elimina a fraqueza de raiz | Experiência de primeiro acesso |

Recomendação técnica: D (raiz) + A (abuso) quando autorizado.

## 5. Revogação server-side de sessão — opções (NÃO implementado)

Hoje o `logout` só apaga o cookie no cliente; o JWT vale até expirar
(30 dias). Não há campo no schema para estado de sessão (mudança proibida
nesta etapa). Opções:

| Opção | Dependência | Efeito | Riscos/custos |
|---|---|---|---|
| A. Allowlist/denylist de `jti` no banco (tabela `PortalSession`) | **Migration** | Logout/invalidação imediata por sessão ou por cliente | Uma consulta por request; housekeeping |
| B. Coluna `sessionsInvalidatedAt` no Client + comparar com `iat` | **Migration** (1 coluna) | Botão "encerrar todas as sessões" por cliente | Granularidade por cliente, não por sessão |
| C. Duração curta + refresh (ex.: 1 dia + renovação silenciosa) | Nenhuma (código) | Janela de revogação implícita reduzida | Complexidade de refresh |
| D. Segredo dedicado do portal com rotação | Variável de ambiente nova (autorização) | Revogação total do portal via rotação | Revoga TODOS os clientes de uma vez |

## 6. Conformidade registrada nesta sessão (Lote 17B)

- `src/middleware.ts` agora aplica issuer/audience exclusivos nas duas
  famílias de token (portal e interna), sem dependências novas (claims
  compartilhados são constantes puras).
- Guarda para `AUTH_SECRET` ausente no middleware (redirect ao login em
  vez de codificar literal `"undefined"` como segredo).
- Nenhuma rota, página, schema, migration, seed ou `.env` alterado além
  do escopo autorizado.
