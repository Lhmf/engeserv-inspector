# LOTE 17C — QA FINAL E PARECER DE LIBERAÇÃO (Portal do Cliente)

> Agente C — 19/10/2026. Documento novo (escopo: `docs/QA-LOTE-17C.md`).
> Nenhuma alteração de implementação foi feita neste lote. Comandos documentados
> são todos reproduzíveis. Diferenciação explícita: **[UNIT]** = teste unitário
> executado; **[ESTÁTICO]** = análise de código; **[HTTP]** = teste HTTP real
> (apenas o que consta como executado pode ser tratado como evidência HTTP).

---

## 1. Baseline e estado do Git

- **Branch:** `main` · **HEAD:** `a18ec43` (mesmo commit do Lote 16C — sem novos commits).
- **`git status --short`:** 31 arquivos rastreados modificados + 17 entradas não rastreadas
  (linhas finais: `32 files changed, 1918 insertions(+), 1370 deletions(-)`).
- Alterações preexistentes de A/B **preservadas integralmente**; nada revertido, limpo ou sobrescrito.
- Nota de contagem: `tsconfig.tsbuildinfo` aparece como modificado (efeito colateral do
  `npx tsc` — regeneração determinística do incremental build info; não é código).
- **Concorrência verificada antes de testar:** varreduras de `LastWriteTime` em
  `src/`, `tests/`, `prisma/`, `docs/` (15:29, 15:30, 15:40–15:43). O Agente B gravou
  durante a janela (`src/middleware.ts` 15:29:26 → 15:32:48; `docs/SECURITY_PORTAL.md`
  15:36:03; `page.tsx` 15:41:49). As validações finais foram executadas somente
  após ≥90 s sem gravações.

## 2. Regras do projeto lidas

`docs/PROJECT_RULES.md` (não duplicar código; regras NR-13 isoladas; permissões
Gestor/Aprovação; documentos sempre a partir do banco) e `docs/QA-LOTE-16C.md`
(matriz anterior). O relatório de B para este lote é `docs/SECURITY_PORTAL.md`
(Lote 17B) — revisado na seção 5.

## 3. Matriz de testes — resultados reais (saída do runner)

**Execução final sob working tree estável:**

| # | Tipo | Teste / Comando | Resultado | Exit | Observação |
|---|---|---|---|---|---|
| 1 | [UNIT] | `npx tsx --test tests/qa/validades.test.ts` | **12/12 pass**, 0 fail, 0 skipped, 0 cancelled | 0 | regras de validade (janela/ordem/decisão manual) |
| 2 | [UNIT] | `npx tsx --test tests/qa/portal-token.test.ts` | **12/12 pass**, 0 fail, 0 skipped, 0 cancelled | 0 | tokens Portal↔interno: round-trip, expiração, rejeições, iss/aud/role, segredo ausente |
| 3 | [UNIT] | `npx tsx src/portal/lib/__tests__/portal-auth.security.test.ts` (arquivo do Agente B; apenas executado) | **14/14 pass**, 0 fail, 0 skipped, 0 cancelled | 0 | login/colisão CNPJ/estados visíveis/claims |
| 4 | [ESTÁTICO→compilação] | `npx tsc --noEmit` | **aprovado** | 0 | após estabilização; primeira execução da janela capturou versão intermediária do middleware (transitório), repetida limpa |
| 5 | [HTTP] | **Isolamento multi-cliente (duas sessões, listagens, detalhes B↔A)** | **BLOQUEADO** | — | ver seção 6. **NÃO executado; NÃO substituído por análise estática** |

**Totais reais:** 38 testes unitários aprovados · 0 falhos · 0 ignorados · tsc 0.

## 4. Revisão do relatório do Agente B (tarefa 5) — claims no middleware

`docs/SECURITY_PORTAL.md` §6 (Lote 17B) afirma que `src/middleware.ts` agora aplica
issuer/audience exclusivos nas duas famílias + guarda para `AUTH_SECRET`. **Confirmado
contra o código** (middleware gravado às 15:32:48):

- Ramo `/portal/**`: guarda `if (!secretEnv) redirect login` (linhas 50–54) e
  `jwtVerify(portalToken, secret, { issuer: PORTAL_SESSION_ISSUER, audience: PORTAL_SESSION_AUDIENCE })` (linhas 59–62).
- Ramo interno: guarda equivalente (linhas 83–86) e
  `jwtVerify(token, secret, { issuer: INTERNAL_SESSION_ISSUER, audience: INTERNAL_SESSION_AUDIENCE })` (linhas 91–94).
- Constantes de claims em `src/portal/lib/portal-session-claims.ts` (puro, Edge-safe).

Uma captura intermediária do middleware (~15:29) ainda não aplicava as claims;
a versão final apply-as-claims **confere com o relatório de B**. Consistência
middleware↔APIs: as APIs do portal rejeitam por `getPortalSession()` (mesmos claims)
e as internas por `verifySessionToken()` (mesmos critérios, validação de `Role`).

## 5. Pendências de segurança (não implementadas, com fonte honesta)

1. **Rate limit do login** — EM ABERTO. `grep` em `src/app/api/portal/**`: 0 ocorrências.
   O próprio B registrou em `SECURITY_PORTAL.md` §4 que contador **em memória** não
   protege em Vercel Functions e listou 4 opções (A: Redis/KV externo; B: middleware
   de ratelimit; C: colunas de lock no banco + migration; D: senha com hash bcrypt).
   **Exige decisão de negócio e autorização** (serviço externo OU migration).
   Credencial inicial de raiz pequena (nome + 6 dígitos do CNPJ) torna força bruta
   viável sem limitador externo.
2. **Isolamento HTTP entre clientes** — BLOQUEADO por infraestrutura (seção 6).
   A própria `SECURITY_PORTAL.md` §3 registra o mesmo: "garantido por inspeção de
   código e testes unitários; teste HTTP permanente pendente".
3. **Decisões de negócio pendentes declaradas por B** (§2): visibilidade de
   `ARCHIVED`; exposição de `notes`/`recommendations` de inspeções `APROVADA` no
   histórico de `equipamentos/[id]`; periodicidade fixa 12 meses nas validades do portal.
4. **Revogação server-side de sessão** — NÃO implementado (logout apenas apaga
   cookie; JWT vale até expirar em 30 dias). Opções registradas em §5 do documento de B.
5. **Observação de falha-fechada silenciosa** (dose de ontem, mantida): `AUTH_SECRET`
   ausente → `verifyPortalSession()`/`verifySessionToken()` retornam `null` sem logar
   (o erro de configuração se torna indistinguível de token inválido). O **middleware**
   agora faz a guarda corretamente (redirect),-as APIs continuam silenciosas.

## 6. Isolamento multi-cliente — EVIDÊNCIA HTTP necessária (BLOQUEADO)

- **Sonda de banco (somente leitura, executada neste lote):** `prisma.client.count()`
  falhou com `PrismaClientInitializationError`; tokens redigidos da mensagem apontam
  **"can't reach database server / please make sure it's running"** (categoria
  "unreachable" — mesma natureza do Lote 16C). Sem Postgres local (5432/5433/3306/1433
  desocupadas), sem SQLite, sem docker-compose.
- **Servidor do projeto:** porta 3000 responde **404** para `/portal/login` e
  `/manifest.json` → processo ouvinte é um bridge de WhatsApp de outro projeto
  (hermes-agent), não pertence a este repositório. Nenhum dev/start deste app em execução.
- **Conclusão:** não há banco de teste acessível com dois clientes fictícios, nem
  servidor deste projeto para requisitar. Conforme regra 7 do lote, o teste HTTP
  de isolamento **permanece BLOQUEADO** e não foi substituído por análise estática.
  **Critério de aceitação:** o parecer não pode registrar "isolamento multi-cliente
  comprovado" — apenas "isolamento por revisão estática + testes unitários da camada
  de sessão; prova HTTP ausente".

## 7. Procedimento de desbloqueio (para o lote seguinte)

1. Container Postgres dedicado a teste, provisionado **com migration+seed de dados
   fictícios** de dois clientes (A e B), executado **com autorização explícita**;
2. `POSTGRES_URL` injetada por `--env-file`/`dotenv-cli` em sandbox (sem tocar no `.env`);
3. `npm run dev -- -p 3100` em janela sem gravações concorrentes;
4. Protocolo HTTP já documentado em `docs/QA-LOTE-16C.md` §3
   (login A/B → listagens com validação de `clientId` universal → detalhes do B
   via sessão A esperando 404 genérico sem corpo → varredura de vazamento →
   Estados ocultos: nenhum `DRAFT/UNDER_REVIEW/REJECTED/ARCHIVED` ou
   `EM_ANDAMENTO/AGUARDANDO_APROVACAO/REJEITADA` em qualquer resposta).

## 8. PARECER FINAL

**APROVADO COM PENDÊNCIAS.**

- Aprovado: qualidade do ciclo local — **38/38 testes unitários**, `tsc` 0,
  builds anteriores 0, revisão de middleware confirma as claims e guardas declaradas.
- Pendências que impedem liberação irrestrita:
  1. **Prova HTTP do isolamento entre clientes** ausente (bloqueio de infraestrutura —
     banco inacessível em test sandbox e servidor do projeto inexistente);
  2. **Rate limit do login** não implementado — força bruta da credencial inicial é
     viável; correções permanentes exigem serviço externo ou migration (autorização);
  3. Decisões de negócio em aberto (visibilidade `ARCHIVED`, campos de notas em
     inspeções `APROVADA`, periodicidade de validades, revogação de sessão).
- Liberação de produção recomendada **somente após**: (a) execução do protocolo HTTP
  com dois clientes; (b) decisão autorizada sobre rate limit (pelo menos mitigações
  transitórias); (c) fechamento das decisões de negócio acima.
