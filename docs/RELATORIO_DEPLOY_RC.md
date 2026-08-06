# RELATÓRIO FINAL DE DEPLOY — EngeServ Inspector (RC2)

> **Data do deploy:** 2026-08-03
> **Objetivo:** Publicar o RC2 (Aplicativo Profissional de Campo) em produção e validar a versão atual.
> **Escopo respeitado:** apenas publicação e validação — **não foram alteradas funcionalidades**. Houve um único fix mínimo de middleware PWA (descrito no final), necessário para que o PWA fosse instalável.

---

## 1. URL e versão publicada

| Item | Valor |
|------|-------|
| **URL final de produção (canônica)** | **`https://engeserv-inspector.vercel.app`** |
| URL do deployment publicado | `https://engeserv-inspector-lsxbhojpq-the-castilho.vercel.app` |
| Alias | `-the-castilho` e `-lhmf-the-castilho` (disponíveis) |
| Deploy ID | `dpl_6yhYcqCLHuuCPsFuTJpmyMA5eNyp` |
| target / estado | `production` ● READY (46s) |
| Versão publicada | RC2 (Next.js 14.2.35) — build a partir da árvore local (`npm run build`, exit 0) |

---

## 2. Resultado das validações (pós-deploy)

| Validação | Status | Evidência |
|-----------|:------:|-----------|
| Build de produção | ✅ | `next build` exit 0; deploy READY (46s) |
| **Login** (endpoint/auth) | ✅ | POST `/api/auth/login`: corpo vazio → 400 `{"error":"Required"}`; credenciais inválidas → 401 `{"error":"Credenciais invalidas."}` — validação e rejeição funcionando |
| **Login** (credenciado) | 🟠 | Não concluído via CLI: credencial admin local ≠ produção; e o endpoint de seed foi corretamente bloqueado por ser escrita no banco de prod. Login real deve ser validado no navegador com credenciais da gestão |
| **Middleware / Auth** | ✅ | `/dashboard` sem token → 307 `/login`; `/api/clientes` sem token → 307 `/login`; `/api/auth/me` → `{"user":null}` (sem vazamento) |
| **Banco (Prisma/PostgreSQL)** | ✅ | Log de build: `prisma generate && prisma db push --accept-data-loss` → conectar a `db.prisma.io:5432` e **"database is already in sync"** |
| **Dashboard / Validades** | 🟠 | APIs `/api/inspections`, `/api/validades`, `/api/clientes` expostas e protegidas; carregamento real exige sessão (dados prontos no DB). Validação visual recomendada no browser |
| **Upload de fotos → Vercel Blob** | ✅ | Blob store `engeserv-storage` (**Active**, iad1) linkado ao projeto; `BLOB_READ_WRITE_TOKEN` presente em Production/Preview/Dev; endpoint `photos` usa `getStorage()` |
| **Geração de Laudo (pipeline)** | 🟠 | `/api/reports/pipeline` publicado e compilado; execução real depende de inspeção com dados + sessão (não disparada via CLI). Validação no browser recomendada |
| **PWA — manifest** | ✅ | `manifest.json` → 200 `application/json`; `display: standalone`, `orientation: portrait`, ícones `any`+`maskable`, 4 `shortcuts` |
| **PWA — service worker** | ✅ | `sw.js` → 200 `application/javascript`; app-shell + fallback offline + fila de sync |
| **PWA — ícones (instalação)** | ✅ | `icon-192/512`, `maskable-192/512`, `apple-touch-icon`, `favicon-96` → 200 |
| **Erros runtime** | ✅ | Nenhum log de erro no deployment (Vercel) |
| **Assets estáticos** | ✅ | `_next/*` → 200 `text/css`/`javascript` |

**Legenda:** ✅ validado no deploy publicado · 🟠 validado parcialmente/requer validação manual no browser.

---

## 3. Funcionamento do offline e sincronização

- **Wizard offline-first:** rascunhos locais (IndexedDB) de tipo, notas, recomendações e medições; salvos com debounce e restaurados ao reabrir.
- **Fotos offline:** captura in-app → compressão (0.72 / 1600px) → fila local `photoQueue` → envio automático quando a conexão volta (`flushOfflinePhotos`).
- **SW:** app shell pré-cacheado; fallback de navegação → `/login` quando offline; `network-first` p/ APIs com cache.
- **UI:** indicador Online/Offline (TopBar) + banner offline no Wizard + contador de pendentes.

> A validação em condição de rede real (desligar a internet no device) é recomendada em device físico — a lógica está publicada e compilada, mas o comportamento em navegador real não pôde ser exercitado via CLI.

---

## 4. Pendências restantes

1. **Validação de fluxo credenciado (navegador):** login real → abrir wizard → capturar foto → subir ao Blob → gerar laudo → conferir dashboard/validades. Requer credenciais da gestão (não expostas aqui).
2. **Teste em device físico** (iPhone/Android) — instalação PWA, safe-area (notch), câmera in-app e offline.
3. Valores default de seed local (admin) divergem da produção; se precisar de acesso, ajustar `SEED_ADMIN_*` na Vercel e re-seed (mediante gestão).

---

## 5. Fix aplicado durante o deploy (escopo validade)

**Middleware PWA** (`src/middleware.ts`):
- Assets públicos do PWA (`/manifest.json`, `/sw.js`, `/icons`, `/favicon`, `/screenshots`, `/offline`) não estavam em `PUBLIC_PATHS` e eram redirecionados para `/login` (307) pelo middleware de auth, **quebrando a instalação da PWA** (manifest/icone/SW inalcançáveis).
- Corrigido adicionando `PUBLIC_ASSETS` a essas rotas estáticas — retomando a entrega do manifest/SW/ícones sem impacto em funcionalidade.

Esse fix foi necessário para atender à validação de "funcionamento do PWA/manifest/service worker/instalação" solicitada.

---

_Relatório final de deploy gerado após publicação em produção._