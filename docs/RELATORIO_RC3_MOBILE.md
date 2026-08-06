# RELATÓRIO RC3 — Mobile UX & Responsividade

> **Data:** 2026-08-03
> **Fase:** RC3 — Mobile UX & Responsividade
> **Objetivo:** transformar o EngeServ Inspector em aplicativo profissional para inspetores em celulares Android 5,5"–7" (320px–1440px).
> **Escopo:** exclusivamente experiência mobile. **Nenhuma funcionalidade de negócio nova** — Engenharia, Cálculos, Pipeline, Banco, APIs e regras NR-13 intactos.

---

## 1. Resumo Executivo

| Validação | Status |
|-----------|:------:|
| `npm run build` (Next.js) | ✅ exit 0 |
| `tsc --noEmit` (app, não-testes) | ✅ sem erros |
| `npm run lint` | ⚠️ não aplicável (sem `.eslintrc`; projeto usa `eslint: ignoreDuringBuilds`) |
| PWA instalável | ✅ (ícones, manifest, viewport/safe-area) |
| Layout mobile (320–1440px) | ✅ tabelas → cards, sidebar drawer, forms 48px |

---

## 2. Páginas revisadas (auditoria FASE 1)

Todas as páginas do `(app)` foram auditadas:

- **Dashboard** — gráficos, KPIs, tabelas (crítico, próximas, recentes)
- **Clientes** — tabela, cards mobile, formulário
- **Equipamentos** — tabela, cards mobile, formulário (ficha técnica)
- **Inspeções** — lista (8 colunas), novo, detalhes, wizard
- **Wizard (5 passos)** — info, fotos, medições, observações, revisão
- **Engineering Studio** — casos, cálculos, KPIs
- **Reports / Laudo** — sidebar off-canvas, seções
- **Laudos** — lista, tabela
- **Usuários** — tabela, formulário
- **Validades** — lista + calendário
- **Configurações** — tabela de textos, formulários
- **Login / Cadastro** — formulários

## 3. Problemas encontrados (auditoria)

1. **Inputs e botões pequenos** — `py-2` (~36px) em todos os formulários; alvo de toque abaixo do mínimo 44×44px.
2. **Zoom automático do iOS** — inputs com `text-sm` (<16px) causam zoom ao focar.
3. **Sidebar fixa em 256px no celular** — quebrava o layout mobile (corrigido no RC2; refinado no RC3).
4. **Tabelas quebrando** — Clientes, Equipamentos, Usuários, Configurações com scroll horizontal excessivo; ilegíveis em <640px.
5. **Engineering Studio** — sub-grids `grid-cols-3` espremidas em 320–390px.
6. **Dashboard pesado** — recharts (~100kB+) no carregamento inicial (~235kB First Load JS).
7. **Header sem safe-area superior** — conteúdo colava no notch em PWA standalone iOS.
8. **Wizard sem ações fixas inferiores** — botões Voltar/Próximo rolavam para fora da tela (ruim em campo).
9. **Fotos sem contador/resumo** — não havia feedback claro de quantas fotos, quantas offline.

---

## 4. Melhorias implementadas (por fase)

### FASE 2 — Design System Mobile
- **`src/app/globals.css`**: no `@layer base`, todos `input/textarea/select` agora têm **min-height 48px**, `font-size 16px` (previne zoom iOS), `border-radius 0.5rem`, e **botões ≥44px**. Isso elevou todos os formulários do sistema de uma vez, sem tocar cada arquivo.
- `html, body { overflow-x: hidden }` — previne scroll horizontal acidental.

### FASE 3 — Sidebar (aplicativo)
- **Mobile (<768px):** drawer off-canvas com overlay escuro, animação `translate`, botão fechar (X), **fecha automaticamente ao navegar** (`onClick={onCloseMobile}` nos links).
- **Tablet/desktop (≥768px):** sidebar fixa colapsável (`md:w-16`/`md:w-64`), `md:shrink-0`.
- AppLayoutClient trava o scroll do body quando o drawer abre; fecha no resize para tablet/desktop.

### FASE 4 — Tabelas → Cards Mobile
- **Clientes, Equipamentos e Usuários**: a `<table>` agora é `hidden md:block`; abaixo de `md` renderiza **cards mobile** (TAG/nome, cliente, status, contador, data, ação). Elimina o scroll horizontal.
- Configurações mantém tabela com `overflow-x-auto` (dados curtos).
- Engineering: sub-grids `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`.

### FASE 5 — Formulários
- Todos os campos já são `w-full`, labels acima, espaçamento `space-y-6`. A elevação global (48px, 16px) garantiu consistência em Clientes, Equipamentos, Inspeções, Usuários, Configurações e Laudos.

### FASE 6 — Wizard
- **Sticky bottom action bar** (`sticky bottom-0`): botões grandes (min-h-12) **Voltar · Salvar rascunho · Próximo/Revisar** sempre visíveis, com `pb-safe` (home indicator iOS).
- Botão **"Salvar rascunho"** manual com feedback "Salvo! ✓".
- Autosave local (debounce) já existia (RC2) — mantido; indicador "Offline — autosave local ativo…".

### FASE 7 — Fotos (estilo iAuditor)
- **Resumo fotográfico** no passo 2: contador "X enviadas · Y offline · N categorias" + badge.
- Captura in-app (CameraCapture, `getUserMedia`, sem salvar na galeria), upload direto ao Vercel Blob quando online; fila offline quando sem conexão (RC2).
- **Big "Tirar Foto"** via botão "Capturar" em cada categoria (melhorável em sprint futura com CTA único).

### FASE 8 — PWA
- **Header com safe-area superior** (`pt-[max(0.5rem,env(safe-area-inset-top))]`) — respeita notch em standalone iOS.
- Mantidos (RC2): `viewport-fit=cover`, theme-color claro/escuro, manifest instalável, ícones maskable, SW app-shell.

### FASE 9 — Performance
- **Charts lazy-loaded** (`next/dynamic` + `ssr:false`) no dashboard → **Dashboard caiu de 235kB → 114kB First Load JS** (chunk de recharts separado, carregado sob demanda).
- Skeleton de carregamento (`animate-pulse`) enquanto os charts carregam.

---

## 5. Componentes alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/globals.css` | Design System Mobile: 48px inputs, 16px font, 44px botões, overflow-x hidden |
| `src/app/(app)/AppLayoutClient.tsx` | Breakpoints `md:`, drawer fecha no resize, scroll lock |
| `src/components/Sidebar.tsx` | Tablet colapsável `md:`, drawer mobile, auto-close on nav |
| `src/components/TopBar.tsx` | Safe-area superior (notch), dropdowns responsivos |
| `src/app/(app)/clientes/page.tsx` | Cards mobile + tabela desktop |
| `src/app/(app)/equipamentos/page.tsx` | Cards mobile + tabela desktop |
| `src/app/(app)/usuarios/page.tsx` | Cards mobile + tabela desktop |
| `src/app/(app)/engineering/page.tsx` | Sub-grids responsivas (`grid-cols-1 sm:grid-cols-3`) |
| `src/app/(app)/inspecoes/[id]/wizard/page.tsx` | Sticky bottom bar, botão "Salvar rascunho", resumo de fotos, contador |
| `src/components/Charts/BarChart.tsx`, `LineChart.tsx` | `"use client"` (para lazy-load) |
| `src/app/(app)/dashboard/DashboardClient.tsx` | Lazy-load dos charts (performance) |

---

## 6. Compatibilidade

### Android (5,5"–7", 320–1440px)
- ✅ Layout fluido: cards mobile <768px, tabelas ≥768px.
- ✅ Botões ≥48px, inputs ≥48px — toque confortável.
- ✅ Drawer com overlay, fechamento automático.
- ✅ PWA: standalone, portrait, ícones maskable, tema #0a1628.

### iPhone (iOS)
- ✅ Safe-area superior/inferior (notch + home indicator).
- ✅ `viewport-fit=cover`, `apple-touch-icon`, `apple-mobile-web-app-status-bar-style`.
- ✅ Font 16px em inputs → sem zoom automático ao focar.
- ✅ Captura in-app (`playsInline`), sem galeria.

---

## 7. Pendências

1. **Botão único grande "Tirar Foto"** (iAuditor-style) com seletor de categoria — hoje cada categoria tem seu próprio botão "Capturar". Requer refactor do passo 2 (não feito para não introduzir funcionalidade nova).
2. **Swipe lateral** na sidebar (opcional, "swipe para abrir") — não implementado.
3. **Dark mode** — toggle existe no TopBar mas tema escuro não está estilizado (fora de escopo).
4. **Teste em device físico** (Android/iPhone) recomendado para calibrar safe-area, câmera e toque real.
5. **Lint config** — não há `.eslintrc`; `next lint` pede configuração interativa. Recomenda-se adicionar ESLint + prettier em sprint futura (fora do escopo RC3).
6. **Deploy em produção** do RC3 não realizado (escopo desta tarefa é build+validação+relatório).

---

## 8. Como validar

```bash
npm run build     # ✅ exit 0
npx tsc --noEmit  # ✅ sem erros de app
```

Validação visual: abrir em device emulator (320/360/390/412/768/1024/1440px), navegar por Clientes/Equipamentos/Usuários (cards mobile), abrir Wizard (sticky bar + fotos), testar offline (DevTools → Network Offline → capturar foto → reconectar).

_Relatório RC3 gerado automaticamente._