# LOTE 18C — Protocolo de Validação HTTP Multi-Cliente (Portal do Cliente)

> Agente C — 19/10/2026. Documento de preparação: **NENHUM teste HTTP foi executado
> neste lote**. Execução exige banco de teste autorizado + servidor de teste
> (ver §3 Pré-requisitos e §7 Bloqueios). Todo endpoint/método/resultado esperado
> abaixo foi confirmado **no código atual** (referências de arquivos/linhas).
> Credenciais: derivadas dos clientes SEMEADOS no banco de teste conforme a regra
> real de login (§4.1) — nunca inventadas nem colhidas de produção.

---

## 1. Arquivos e scripts de teste existentes (inventário)

### Executáveis (node:test + tsx; nenhum dependência nova)
| Arquivo | Suíte | Última execução conhecida |
|---|---|---|
| `tests/qa/validades.test.ts` (C) | regras de validade | Lote 17C: 12/12, exit 0 |
| `tests/qa/portal-token.test.ts` (C) | tokens Portal↔interno (sign/verify, iss/aud/role, rejeições) | Lote 17C: 12/12, exit 0 |
| `src/portal/lib/__tests__/portal-auth.security.test.ts` (B) | auth, colisão de CNPJ, estados visíveis | Lote 17C: 14/14, exit 0 |

### Não executáveis no estado atual
- `src/modules/engineering/__tests__/*.test.ts` (4 arquivos, estilo Jest/globals;
  sem Jest instalado; comentados como "aguardando valores oficiais do engenheiro").

### Fixtures / dados
- **Nenhum fixture de dois clientes existe no repositório.** Os seeds são
  `prisma/seed.ts`, `prisma/seed-demo.ts`, `prisma/seed-text-templates.ts`
  — não foram aplicados neste lote (restrição do lote: sem seeds).
  O banco de teste precisará ser provisionado com **dois clientes + dados próprios**
  (ver §3). `scripts/check-db.ts` é um verificador de dados existentes (lê e imprime
  registros — usar apenas contra banco de teste e avaliar se vaza dados no log).

## 2. Contratos reais confirmados no código (base do protocolo)

| Contrato | Fonte |
|---|---|
| `POST /api/portal/login` — body JSON `{ primeiroNome, cnpj }`; 200 `{success:true, clientId, name}` + cookie httpOnly `portal_session`; 400 se campo ausente; 401 `{success:false, error}` | `src/app/api/portal/login/route.ts:4-19` |
| Regra de credencial: primeiro nome deve casar com **início** de `companyName` ou `contactName`; senha = 6 primeiros dígitos do CNPJ; prefixo ambíguo → recusa (`ambiguous`) | `src/portal/lib/portal-auth.ts` (`selectLoginClient`, L221-251) |
| `GET /api/portal/session` — **sempre 200**: `{session:null}` sem sessão, ou `{session:{clientId,name,role:"CLIENTE"}}` | `src/app/api/portal/session/route.ts:4-17` |
| `POST /api/portal/logout` — apaga cookie, `{ok:true}` (200) | `src/app/api/portal/logout/route.ts:3-7` |
| Listagens: `GET /api/portal/{dashboard,equipamentos,laudos,documentos,frentes,calendario,recomendacoes}` — 401 `{error:"Não autenticado."}` sem sessão; dados escopados por `session.clientId` | cada `route.ts` (L11-15/13-17/9-11 aprox.) |
| Detalhes via `findFirst` composto (id + clientId) → **404 genérico**: equipamento: `"Equipamento não encontrado ou acesso não autorizado."` (`src/app/api/portal/equipamentos/[id]/route.ts:36-37`); laudo: `"Laudo não encontrado ou acesso não autorizado."` (`laudos/[id]/route.ts:91-93`); frente: `"Frente não encontrada ou acesso não autorizado."` (`frentes/[id]/route.ts:51-52`) | confirmado |
| Sessão inválida/ausente em páginas `/portal/**` (exceto `/portal/login`): **redirect 302 → `/portal/login`** no middleware | `src/middleware.ts:41-67` |
| Middleware valida issuer/audience exclusivos: token interno no `portal_session` → 302 login; token de portal no `engeserv_session` → 302 `/login` | `src/middleware.ts:59-62, 91-94` |
| APIs `/api/portal/**` **não passam pelo ramo portal do middleware** (401 JSON na rota, por design) | `src/middleware.ts:15` (PUBLIC_PATHS) + comentário L37-40 |
| Estados visíveis ao portal: laudos `APPROVED`,`PUBLISHED`; inspeções `APROVADA` — ocultos `DRAFT/UNDER_REVIEW/REJECTED/ARCHIVED` e `EM_ANDAMENTO/AGUARDANDO_APROVACAO/REJEITADA` | `src/portal/lib/portal-visible-states.ts`; conexão `portal-visible-states` presente em: laudos, laudos/[id], recomendacoes, equipamentos/[id], dashboard |
| `/api/portal/equipamentos` devolve array com `id, tag, ...` **sem** campo `clientId` explícito — asserção de propriedade deve ser por **conjunto de IDs** conhecido do banco de teste | `equipamentos/route.ts:46-60` |
| `/api/portal/dashboard` devolve `stats` + contadores (sem listar IDs de outros clientes) | `dashboard/route.ts:93-95+` |

## 3. Pré-requisitos para EXECUTAR o protocolo (nenhum自动 feito neste lote)

1. **Banco de teste dedicado** (ex.: container Postgres local, porta exclusiva), com
   migrations aplicadas **e seed autorizado** criando exatamente:
   - Cliente A e Cliente B (CNPJs **com prefixos de 6 dígitos DIFERENTES** entre si e
     de qualquer outro cliente do banco, para evitar o caminho `ambiguous`);
   - Para cada cliente: ≥1 equipamento ativo, ≥1 inspeção `APROVADA` com laudo no
     estado visível (`APPROVED` ou `PUBLISHED`), ≥1 laudo `DRAFT` (para testar ocultação),
     ≥1 frente/site, ≥1 documento — todos claramente marcados/testáveis por nome;
   - registrar em arquivo os IDs reais (A: `idEquipA`, `idLaudoA`, `idFrenteA`; B idem).
2. **Credenciais derivadas** (após seed): para cada cliente, `primeiroNome` =
   prefixo case-insensitive real de `companyName`/`contactName`; `cnpj` com os
   6 dígitos do prefixo (regra de `portalLogin`). Registrá-las no runbook do banco de teste.
3. **Servidor**: `npm run dev -- -p 3100` (porta exclusiva; porta 3000 tem processo de
   outro projeto). Aguardar "Ready". Executar **sem gravações concorrentes**
   (reexecutar varredura de `LastWriteTime` antes; exigir ≥90 s de silêncio).
4. **Banco apontado por variável de ambiente da sessão** (`--env-file`/`dotenv-cli`),
   **sem editar `.env`** e sem apontar para produção.
5. Diretório de evidências criado fora do repositório (ex.: `%TEMP%\qa-18c\`),
   gravando status codes e corpos (sem valores de cookies/tokens).

## 4. Cenários (endpoint / método / auth / esperado / evidência)

### F0 — Saneamento (antes de qualquer teste)
| Passo | Ação | Esperado | Evidência |
|---|---|---|---|
| 0.1 | `GET http://localhost:3100/api/portal/session` sem cookie | **200** `{session:null}` (contrato específico) | `e0-1.json`, status 200 |
| 0.2 | `GET /portal/dashboard` sem cookie | **302/307 redirect → `/portal/login`** | salvar `Location` do header |

### F1 — Autenticação dos dois clientes
| Passo | Endpoint/Método | Auth | Esperado | Evidência |
|---|---|---|---|---|
| 1.1 | `POST /api/portal/login` body A | nenhum | **200** `{success:true, clientId:"<idA>", name:"<nomeA>"}` + `Set-Cookie portal_session` | status/corpo SEM o valor do cookie; manter WebSession A (`-SessionVariable sessA`) |
| 1.2 | idem para B | nenhum | **200 com clientId B**; sessão B separada | idem (`sessB`) |
| 1.3 | credencial errada (nome que não casa) | nenhum | **401** `{success:false, error:"Nome do cliente não corresponde..."}` | status + corpo |
| 1.4 | CNPJ prefixo inexistente | nenhum | **401** `{success:false, error:"Credenciais inválidas..."}` | idem |

### F2 — Acesso PRÓPRIO permitido (A e B)
Para cada rota abaixo, executar 2× (uma com sessão A, outra com sessão B):

| Endpoint | Método | Auth | Esperado | Evidência a capturar |
|---|---|---|---|---|
| `/api/portal/dashboard` | GET | cookie do próprio | 200 + `stats.totalEquipamentos` **coincide** com contagem SQL do cliente no banco de teste | corpo completo + contagem SQL de referência |
| `/api/portal/equipamentos` | GET | próprio | 200; **todos os `id` ∈ IDs do próprio cliente**; nenhum id do outro | array de ids + diff com lista SQL |
| `/api/portal/laudos` | GET | próprio | 200; todos os registros → inspeção→equipamento do próprio; **nenhum `status` fora de `APPROVED/PUBLISHED`** | ids + status listados |
| `/api/portal/documentos` | GET | próprio | 200; contagem = documentos do próprio | corpo + SQL de referência |
| `/api/portal/frentes` | GET | próprio | 200; apenas sites/frentes do próprio | ids + SQL |
| `/api/portal/calendario` | GET | próprio | 200; contadores coerentes com validades do próprio | corpo |
| `/api/portal/recomendacoes` | GET | próprio | 200; origens somente do próprio | corpo |
| `/api/portal/session` | GET | próprio | 200 `{session:{clientId:"<próprio>",role:"CLIENTE"}}` | corpo (clientId visível) |

### F3 — Acesso CRUZADO negado (A→B e B→A)
Com a sessão de A, solicitar detalhes pelos IDs reais de B (e o inverso):

| Endpoint do recurso de B | Método | Auth | Esperado | Evidência |
|---|---|---|---|---|
| `/api/portal/equipamentos/{idEquipB}` | GET | sessão A | **404**, corpo `{"error":"Equipamento não encontrado ou acesso não autorizado."}` SEM dados do recurso | status + corpo integral |
| `/api/portal/laudos/{idLaudoB}` | GET | sessão A | **404** `{"error":"Laudo não encontrado ou acesso não autorizado."}` sem dados | idem |
| `/api/portal/frentes/{idFrenteB}` | GET | sessão A | **404** `{"error":"Frente não encontrada ou acesso não autorizado."}` sem dados | idem |
| Lista `/api/portal/laudos` (sessão A) | GET | sessão A | nenhum `id` de laudo de B presente | diff de IDs |

Repetir os 4 itens trocando A↔B (sessão B contra IDs de A). **Critério de aprovação do
cenário:** todos os 8 (4×2) retornarem 404 sem corpo de dados, e as listagens de cada
sessão não contiverem nenhum ID do outro.

### F4 — Sem sessão / sessão inválida
| Endpoint | Método | Auth | Esperado | Evidência |
|---|---|---|---|---|
| Cada rota listada em F2 (7 rotas) | GET | nenhum | **401** `{error:"Não autenticado."}` | status + corpo |
| `/api/portal/equipamentos/{idEquipA}` | GET | nenhum | **401** (antes da busca) | idem |
| `/portal/dashboard` | GET | cookie inválido ("lixo") | **302 → `/portal/login`** | header Location |
| `/portal/dashboard` | GET | cookie expirado (JWT com exp passado, assinado pela chave de teste) | **302 → `/portal/login`** | idem |

### F5 — Incompatibilidade interna↔portal (cookies trocados)
| Endpoint | Cookie | Esperado | Evidência |
|---|---|---|---|
| `/api/portal/equipamentos` | `engeserv_session` com token interno VÁLIDO (obtido do login interno no banco de teste) | **401** (`getPortalSession` rejeita iss/aud do interno) | status + corpo |
| `/portal/dashboard` | `portal_session` contendo token INTERNO | **302 → `/portal/login`** (middleware exige iss do portal) | header Location |
| `/dashboard` (página interna) | `engeserv_session` contendo token de PORTAL | **302 → `/login`** | header Location |
| `/api/validades` (API interna) | `engeserv_session` contendo token de PORTAL | **401** (`getSession`→`verifySessionToken` rejeita role `CLIENTE`/iss) | status + corpo |

### F6 — Estados ocultos (cruzamento segurança × conteúdo)
Com cada sessão: em **todas** as respostas de F2/F3, garantir:
- nenhum laudo com `status ∈ {DRAFT, UNDER_REVIEW, REJECTED, ARCHIVED}`;
- nenhuma inspeção com `status ∈ {EM_ANDAMENTO, AGUARDANDO_APROVACAO, REJEITADA}`;
- no `equipamentos/[id]` do próprio: `ultimasInspecoes`/`laudo` só com estados permitidos.
Evidência: grep dos corpos salvos por essas strings (0 ocorrências).

### Critérios de aprovação do protocolo completo
- F1: A e B autenticam com clientId distintos; 1.3/1.4 recusam.
- F2: 100% das respostas 200 e 100% dos IDs/contagens batendo com o do próprio cliente.
- F3: 8/8 responses 404 genéricos, sem corpo de dados, em ambas as direções.
- F4: 401 em todas as APIs sem sessão; redirects corretos nas páginas.
- F5: rejeição mútua portal↔interno em API e página (4/4).
- F6: zero estados ocultos em qualquer corpo.
**Qualquer falha → registrar evidência, endpoint, e NO IMPLEMENTAR; reportar ao Agente B.**

## 5. Execução sugerida (esqueleto PowerShell — NÃO executado neste lote)

```powershell
# Banco/servidor pré-requisitos satisfeitos (§3). Evidências em %TEMP%\qa-18c\
$r = Invoke-WebRequest -Uri http://localhost:3100/api/portal/login -Method Post `
  -ContentType 'application/json' -Body '{"primeiroNome":"<nomeA>","cnpj":"<prefixoA>"}' `
  -SessionVariable sessA   # F1.1
# ... F1..F6 com -WebSession $sessA / $sessB
# F3: $r = Invoke-WebRequest ".../api/portal/equipamentos/<idEquipB>" -WebSession $sessA -SkipHttpErrorCheck
```
Nada é impresso com valores de cookies/tokens; corpos são filtrados para campos de negócio.

## 6. Bloqueios atuais (21/10 — não reassessados com sonda neste lote)
1. Banco de teste inexistente/inacessível (sonda do Lote 17C: "can't reach database server");
   nenhum container/compose; seeds não autorizados a rodar neste lote.
2. Porta 3000 ocupada por processo de outro projeto (hermes-agent) — usuário é a porta 3100.
3. Servidor deste projeto: nenhum em execução no último check.
4. Credenciais reais de clientes só existem no banco (não acessível) — precisam vir do seed do banco de teste.

**Condição de parada`: se a única opção de provisionamento for usar o banco de
produção ou sobrescrever dados existentes de qualquer banco, o protocolo NÃO deve
ser executado — parar e escalar a decisão ao responsável.

## 7. Confirmações deste lote
- NÃO conectei ao banco atual (nenhuma query executada; sonda não rodou neste lote).
- NÃO alterei implementação, schema, migrations, seeds, `.env` ou `.next`.
- NÃO executei seeds, migrations, instalações, build ou testes HTTP.
- NÃO fiz commit/push/deploy/nada na Vercel.
- NÃO apaguei, restaurei ou reverti arquivo algum; apenas criei `docs/QA-LOTE-18C.md`.
- NÃO declarei teste executado: este lote é de preparação (regra 9).
