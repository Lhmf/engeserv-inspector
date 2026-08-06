# AUDITORIA RC4 — Gargalos identificados (FASE 1)

> Auditado em 2026-08-04. Lista completa de problemas encontrados antes de qualquer correção.

## 1. Dark Mode (FASE 5) — CRÍTICO
- O toggle do TopBar alterna a classe `.dark` no `<html>`, mas **nada reage**:
  - `tailwind.config.ts` **sem `darkMode: "class"`** → Tailwind não gera variantes `dark:`.
  - `globals.css` **sem `.dark` rules** e sem CSS variables de tema.
  - **352 ocorrências** de cores hardcoded (`bg-white`, `bg-slate-50`, `text-slate-800`, `border-slate-200`) em 49 arquivos, sem `dark:` overrides.
- Efeito: botão muda o ícone, página permanece clara. **Dark mode é um no-op.**

## 2. Headers duplicados/sticky (FASE 3)
- `engineering/page.tsx:546` — segundo header `sticky top-0 z-10` oculto atrás do TopBar (z-30).
- `reports/[id]/page.tsx:207` — header `sticky top-0 z-30` colide com o TopBar; sem safe-area (notch).
- `wizard/page.tsx:504` — progresso `sticky top-4 z-10` parcialmente coberto pelo TopBar.
- TopBar já tem safe-area; os demais não.

## 3. Tabelas que quebram no mobile (FASE 2)
- **Configurações** — tabela `min-w-[560px]` visível em todas as larguras, sem cards mobile.
- **Dashboard** — 3 tabelas (`overflow-x-auto`) sem variante de cards <768px.
- **Inspeções** — 6 colunas ainda forçam scroll no mobile (só Medições/Fotos são ocultas).
- **Wizard medições** — tabela de 6 colunas com 4 inputs inline: **inutilizável no celular** (tela de coleta de campo).

## 4. Touch / a11y (FASE 4)
- Links de ícone em ações de linha ~36px (inspecoes:209-222) — sem `aria-label`.
- Drawer/sidebar off-canvas ainda foca links ocultos (sem `invisible`/`aria-hidden`).
- Botão fechar drawer ~32px (Sidebar:96-104).
- Calendário de Validades: botões nav ~36px + eventos ~20px — sem `aria-label`.
- Buscas/selects sem `<label>`/`aria-label` (inspecoes, laudos, validades).
- Reports sidebar: off-canvas mas focável; toggle sem `aria-label`.

## 5. Performance (FASE 6)
- **reports/[id] = 102KB** — importa 11 componentes de seção estaticamente. Lazy-load `HistoryTimeline`, `SignaturePanel`, `Attachments` é o maior win.
- **`engineering/page.tsx.bak`** — arquivo morto 11.2KB (deletar).
- **3 KPI components** duplicados (StatCard, KpiCard, KpiCard inline no engineering).
- `Sidebar.tsx` `STATUS_CONFIG` + import `getEquipmentTypeLabel` — código morto.
- `AppLayoutClient` é client island que hidrata em toda rota autenticada (custo moderado).
- Primeira tela: vendor `decimal.js` (339KB) já fora do caminho crítico (recharts lazy). Reports page é o mais pesado.

## 6. Bugs de render/usabilidade
- **`MeasurementTable.tsx:118,122`** — classe renderiza a string literal `"{ternary}"` no className (cor de warning nunca aplicada). **Bug real.**
- **`NewEquipmentForm.tsx`** — grupos "Fabricante"/"Identificação Adicional" duplicam campos 2–3x com estados separados.

## 7. PWA (FASE 7)
- Manifest completo (standalone, ícones, shortcuts). SW v3 com app-shell+offline+sync.
- Melhorias: `theme_color`/`background_color` por scheme (dark), considerar splash.

## 8. Fotos (FASE 8)
- Captura in-app (CameraCapture), sem galeria, compressão 0.72/1600px, fila offline, upload Vercel Blob, miniaturas imediatas. **Fluxo OK.**
- Gap menor: miniaturas em categorias já implementadas (RC3.1).

## Prioridade de correção
1. Dark mode completo (config + tokens + variantes nos primitivos + persistência).
2. Bugs: MeasurementTable ternary, deletar `.bak`.
3. Tabelas → cards: Configurações, Dashboard, Inspeções, Wizard medições.
4. Headers sticky duplicados (engineering, reports, wizard) + safe-area.
5. Touch/a11y: links de ícone 44px, aria-labels, drawer foco.
6. Performance: lazy-load seções do reports, consolidar KPIs, limpar mortos.
7. PWA: theme_color por scheme.
8. Build + CHANGELOG + TODO + ROADMAP + RELATORIO + deploy.
