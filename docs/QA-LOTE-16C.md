# Lote 16C — Matriz de QA do Portal (e consolidação 15C/15D-C)

> Gerado pelo Agente C em 19/10/2026. Documento novo; não substitui conteúdo preexistente.
> Estado do working tree no momento da execução inclui correções do Agente B
> gravadas entre 10:18 e ~10:31 (issuer/audience, role, colisão de CNPJ, filtros de estado).
> Executar os comandos abaixo reproduz os resultados.

## 1. Matriz de testes

| # | Teste | Comando | Resultado | Código de saída | Evidência |
|---|---|---|---|---|---|
| 1 | Regras de validade (janela, ordem, decisão manual) | `npx tsx --test tests/qa/validades.test.ts` | **PASSOU** (12/12) | 0 | `tests/qa/validades.test.ts` |
| 2 | Tokens Portal ↔ interno (sign/verify, iss/aud/role, expiração, rejeições) | `npx tsx --test tests/qa/portal-token.test.ts` | **PASSOU** (12/12) | 0 | `tests/qa/portal-token.test.ts` |
| 3 | Testes de segurança do Agente B (`portal-auth`) | `npx tsx src/portal/lib/__tests__/portal-auth.security.test.ts` | **PASSOU** (14/14) | 0 | arquivo de B, apenas executado |
| 4 | `npx tsc --noEmit` | `npx tsc --noEmit` | **PASSOU** | 0 | executado após estabilização do working tree |
| 5 | `npm run build` | `npm run build` | **PASSOU** (rota a rota, incl. `/portal/**`) | 0 | saída completa do build |
| 6 | HTTP: isolamento multi-cliente ( duas sessões, listagens e detalhes) | — | **BLOQUEADO** | — | sem banco acessível e sem servidor do projeto |
| 7 | HTTP: 401 sem sessão; B→A por ID; vazamentos | — | **BLOQUEADO** | — | idem, protocolo na seção 4 |
| 8 | NPM `test`/runner de Deming (24/24 citado em Lote 14) | — | **NÃO REPRODUZÍVEL** | — | não há Jest/Vitest instalado (`package.json` sem script `test`; `__tests__` de engenharia usam globals de Jest) |

## 2. Achados de segurança — status atual (verificados neste lote)

| Achado (Agente B) | Status | Evidência |
|---|---|---|
| 1. Laudos DRAFT/REJECTED e inspeções não finalizadas expostos | **Correção implementada pelo Agente B durante o lote** (filtros conectados a 5 rotas: `dashboard`, `equipamentos/[id]`, `laudos`, `laudos/[id]`, `recomendacoes`; módulo novo `src/portal/lib/portal-visible-states.ts`) | validado unitariamente pela suíte 14/14 do B; **validação HTTP pendente** |
| 2. AUTH_SECRET compartilhado sem issuer/audience | **Correção implementada pelo Agente B durante o lote** (`portal-auth.ts` exige iss/aud do Portal + `role==="CLIENTE"`; `src/lib/auth.ts` exige iss/aud internos + enum `Role`) | testes 2 e 3 acima (round-trip e rejeições mútuas) |
| 3. Login sem rate limit | **EM ABERTO** (0 ocorrências de rate limit/attempt tracking em `src/app/api/portal`) | `grep`. Colisão de prefixo de CNPJ já corrigida (`selectLoginClient`, recusa `ambiguous`) |

## 3. Protocolo HTTP de isolamento (bloqueado — como executar quando houver infra)

Pré-condições: banco de teste acessível com dois clientes (A e B) e dados dos dois;
servidor Next deste projeto rodando (p. ex. `npm run dev -p 3100`) sem conflito de porta.

1. `POST /api/portal/login` — credenciais A → guardar cookie `portal_session_A` (httpOnly).
2. Repetir para B → `portal_session_B`.
3. Para cada rota `GET /api/portal/{dashboard,equipamentos,laudos,documentos,frentes,calendario,recomendacoes}`:
   com cookie A → 200 e **todos** os registros devem ter `clientId === A`;
   sem cookie → 401; cookie inválido/expirado → 401/404.
4. Detalhes com IDs do B conhecidos no banco de teste, usando cookie A:
   `/api/portal/laudos/{idB}`, `/api/portal/equipamentos/{idB}`, `/api/portal/frentes/{idB}`
   → 404 esperado ("não encontrado ou acesso não autorizado"), **sem corpo do recurso B**.
5. Verificar ausência de campos indesejados (IDs de outros clientes, e-mails internos, números de ART de terceiros).
6. CRUZAR com filtros de estado: nenhum laudo `DRAFT/UNDER_REVIEW/REJECTED/ARCHIVED`, nenhuma inspeção `EM_ANDAMENTO/AGUARDANDO_APROVACAO/REJEITADA` deve aparecer em listagens ou detalhes (protocolo concernente ao achado 1).

Rascunho de coleta sugerido (PowerShell, sem expor tokens): usar `Invoke-WebRequest -SessionVariable`.

## 4. Observações técnicas registradas (sem alteração de código)

- `verifyPortalSession`/`verifySessionToken` engolem erros de configuração
  (`AUTH_SECRET` ausente → retorno silencioso `null`, pois `getSecretKey()` é chamado
  dentro do `try`). Falha-fechada, porém o sintoma é indistinguível de "token inválido"
  e pode mascarar misconfiguration. Sugestão futura (Agente B): logar ou falhar alto em ambiente
  de produção quando o segredo estiver ausente.
- `process.env.X = undefined` em Node NÃO remove a variável (vira a string `"undefined"`);
  a suíte de tokens usa `delete process.env.AUTH_SECRET` para isolar segredos de teste (risco que ficou documentado em teste).
- Processo ouvindo a porta 3000 é um bridge de WhatsApp de outro projeto (hermes-agent) —
  não é este app; usar portas exclusivas para testes (ex.: 3100).

## 5. Bloqueios de infraestrutura e desbloqueio

1. **Banco**: `POSTGRES_URL` presente no `.env` mas o servidor não responde
   (Prisma: "Can't reach database server"). Não há Postgres local em escuta
   (5432/5433/3306/1433 vazias), nem SQLite, nem docker-compose.
   Desbloqueio: fornecer banco de TESTE (container local dedicado a este projeto,
   com migration+seed em dados fictícios de dois clientes) e apontar
   `POSTGRES_URL` nele apenas via `dotenv-cli`/`--env-file` em sandbox, sem tocar no `.env`.
2. **Runner de tests**: nenhum Jest/Vitest instalado. Uso atual `node:test` via `tsx`
   (sem novas dependências). Os `__tests__` de engenharia (4 arquivos) continuam
   aguardando valores oficiais do engenheiro e exigiriam Jest para rodar como estão.
3. **Concorrência**: durante este lote, arquivos de A/B mudaram a cada 30–60 s;
   validação final (tsc/build) executada somente após 90 s sem alterações.
