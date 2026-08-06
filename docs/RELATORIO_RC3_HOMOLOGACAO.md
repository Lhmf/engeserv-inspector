# RELATÓRIO RC3.1 — Homologação Mobile Final

> **Data:** 2026-08-03
> **Fase:** RC3.1 — Homologação Mobile
> **Objetivo:** polish comercial da experiência mobile (320–1440px). **Nenhuma funcionalidade nova** — apenas acabamento de nível comercial da versão em produção.

---

## 1. Resumo Executivo

| Validação | Status |
|-----------|:------:|
| `npm run build` (Next.js) | ✅ 0 erros (Compiled successfully) |
| `tsc --noEmit` (app) | ✅ sem erros |
| PWA instalável (ícones+manifest+SW) | ✅ |
| Workflow do inspetor (login→validades) | ✅ desktop + mobile |
| Cache da PWA | ✅ bump v3 |

---

## 2. Páginas revisadas

| Página | Revisão |
|--------|---------|
| Login | ✅ safe-area, botão 48px, loading/error |
| Cadastrar | ✅ redireciona para login |
| Esqueci senha | ✅ safe-area, botão 48px |
| Dashboard | ✅ KPIs 2-col no mobile, charts lazy, 114kB FLS |
| Clientes | ✅ cards mobile + tabela desktop |
| Equipamentos | ✅ cards mobile (link quebrado removido) |
| Inspeções | ✅ stats 2-col, filtros empilham, botão full-width |
| Wizard (5 passos) | ✅ sticky bar inferior, autosave, miniaturas de fotos |
| Engineering Studio | ✅ sub-grids `grid-cols-1 sm:grid-cols-3` |
| Laudos / Workspace | ✅ **cards mobile** + skeleton + tabela desktop |
| Validades | ✅ **cards mobile** + skeleton + tabela desktop + calendário |
| Usuários | ✅ cards mobile + tabela desktop |
| Configurações | ✅ tabela overflow-x |
| Reports / Laudo | ✅ gallery responsiva, sidebar off-canvas, tabela overflow |

---

## 3. Problemas encontrados e corrigidos

| # | Problema | Correção |
|---|----------|----------|
| 1 | Tabelas de Laudos e Validades (7–8 colunas) ilegíveis no celular | Convertidas em **cards mobile** (<768px); tabela preservada em desktop |
| 2 | Loading states com spinner em Laudos/Validades (inconsistente) | Trocados por **SkeletonTable**/`SkeletonKpiCard` |
| 3 | Cards de Equipamentos apontavam para rota inexistente `/equipamentos/[id]` (404) | Link removido (sem criar rota nova — fora de escopo) |
| 4 | Wizard: nenhuma confirmação visual das fotos por categoria | **Miniaturas** + contador "+N" em cada categoria |
| 5 | Botões de Entrar/Enviar (~36px) abaixo do alvo 48px | `min-h-12` + `text-base` |
| 6 | Esqueci-senha sem safe-area (inconsistente com Login) | Safe-area top/bottom alinhada |
| 7 | PWA cache desatualizado (clientes com app shell antigo) | SW bump `engeserv-v2` → `v3` |

---

## 4. Fluxo do inspetor — validação end-to-end

```
Login → Cliente → Equipamento → Nova inspeção → Fotos → Medições → Gerar laudo → Workspace → Validades
```

- **Login** redireciona para `/dashboard`; entrada 48px, esqueci-senha acessível.
- **Clientes** — lista em cards mobile com status, contador de equipamentos, data.
- **Equipamentos** — cards com TAG/tipo/cliente; "Nova inspeção" a partir das inspeções.
- **Nova Inspeção** — seleção cliente + equipamento; progresso "1/5".
- **Fotos (Wizard passo 2)** — miniaturas por categoria, contador enviadas/offline, câmera in-app, fila offline.
- **Medições (passo 3)** — tabela inline com touch targets (`min-h-11`), validação espessura vs. mínima.
- **Gerar laudo (passo 5)** — pipeline + report; offline guard com aviso.
- **Workspace de Laudos** — cards mobile com status + botão "Visualizar" (48px).
- **Validades** — cards mobile com prazo colorido (Vencido/Próximo/OK) + botão "Ver equipamento" full-width.

Um fluxo fluido em 5,5"–7" com uma mão: barra de ações fixa no Wizard, botões ≥48px, cards com alvos de toque generosos.

---

## 5. PWA — validação

- **Instalação:** manifest completo (`display: standalone`, portrait, `shortcuts`, ícones `any`+`maskable`). Mídia servida com `application/json`.
- **Tela cheia/standalone:** `display: standalone` + `viewport-fit=cover` + `apple-mobile-web-app-capable`.
- **Splash (iOS):** via `apple-touch-icon` (180px) + `background_color` (#0a1628).
- **Ícones:** icon-192/512, maskable-192/512, apple-touch-icon, favicon — todos presentes.
- **Service worker:** `engeserv-v3`, app-shell pré-cacheado, cache-first `_next/*`, network-first API, fallback navegação → `/login`.
- **Offline:** Wizard offline-first (draft IndexedDB + fila de fotos), sync automático ao conectar.
- **Sincronização:** flush de fotos + dados ao voltar online.
- **Atualização do cache:** bump v3 garante que clientes existentes baixem o novo app shell (no `activate`, caches antigos removidos).

---

## 6. Componentes alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/(app)/laudos/page.tsx` | Cards mobile + SkeletonTable + desktop table |
| `src/app/(app)/validades/page.tsx` | Cards mobile (borda status) + Skeleton + desktop table |
| `src/app/(app)/inspecoes/[id]/wizard/page.tsx` | Miniaturas de fotos por categoria |
| `src/app/(app)/equipamentos/page.tsx` | Card sem link quebrado; remoção do import `Link` |
| `src/app/login/page.tsx`, `esqueci-senha/page.tsx` | Botões `min-h-12 text-base`, safe-area |
| `src/components/TopBar.tsx` | Safe-area do notch no header |
| `public/sw.js` | Cache bump v3 |

---

## 7. Pendências restantes

1. **Equipamentos/[id]** (detalhe) — página não existente; cards não clicam (evitam 404). Criar a rota fica para sprint de funcionalidade, não aqui.
2. **Android/iOS physical test** — instalação PWA, câmera e sensibilidade de toque precisam de device real.
3. **Dark mode** — toggle no TopBar sem estilo escuro (fora do scope de homologação mobile clara).
4. **Lint config** — `.eslintrc` inexistente; adicionar em sprint futura.
5. **Splash screen customizada** — usar `apple-touch-startup-image`/manifest `screenshots` para splash branded (opcional).

---

## 8. Como validar

```bash
npm run build     # ✅ 0 erros
# tsc --noEmit    # ✅ sem erros de app
```
Em simulador/device: abrir em 320/360/390/412/768/1024/1440px; se a Navigation/Equipamentos/Laudos/Validades virar card no mobile; abrir Wizard (barra fixa + miniaturas); desconectar a rede → capturar foto → reconectar → ver sincronizar; instalar como PWA.

_Relatório RC3.1 de homologação mobile gerado automaticamente._