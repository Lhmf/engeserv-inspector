# TODO.md

Backlog de curto prazo. Itens concluídos migram para `CHANGELOG.md`.

## Concluído na RC4 — Aplicativo Profissional (06/08/2026)

- [x] **Dark mode completo** — `darkMode: class`, tokens CSS variables, anti-flash script, persistência, remapeamento dos utilitários, primitivos com dark (Button/Card/Badge/StatCard/etc.)
- [x] **Responsividade** — tabelas→cards mobile em Dashboard, Inspeções, Laudos, Clientes, Equipamentos, Usuários, Validades, Wizard medições; tabela preservada em desktop
- [x] **Touch/a11y** — alvo mínimo 44×44px, aria-labels em ações/filtros/calendário, drawer invisível+aria-hidden, estados active/pressed/focus
- [x] **Performance** — Dashboard memo + charts lazy, reports 9 seções lazy, MeasurementTable memo, remoção de código morto (.bak, Sidebar)
- [x] **PWA** — manifest completo (theme_color por scheme, maskable, shortcuts), safe-areas, SW v3
- [x] **Fotos** — fluxo validado (câmera in-app → compressão → Vercel Blob → URL → miniatura → laudo)
- [x] **NewEquipmentForm** — removidas duplicações de campos (3x → 1x)
- [x] **264 erros TypeScript pré-existentes corrigidos** (testes do Engine + @types/jest)
- [x] Build ✅ · tsc ✅ · CHANGELOG/TODO/ROADMAP atualizados

## Concluído na Sprint 1

- [x] Criar projeto Next.js (App Router) + Tailwind
- [x] Criar schema Prisma (User, Client, Equipment)
- [x] Criar autenticação (login, logout, sessão via cookie)
- [x] Criar middleware de proteção de rotas
- [x] Criar sidebar + topbar responsivos
- [x] Criar dashboard com KPIs reais
- [x] Criar módulo de Usuários (criar Gestor/Funcionário com permissão)
- [x] Criar script de seed do Administrador Master
- [x] Criar páginas placeholder: Clientes, Equipamentos, Inspeções, Laudos,
      Validades, Configurações
- [x] Configurar `vercel.json` / instruções de deploy
- [x] Escrever docs/PROJECT_RULES.md, ARCHITECTURE.md, ROADMAP.md,
      TODO.md, CHANGELOG.md, NR13_BUSINESS_RULES.md

## Concluído na Sprint 2

- [x] Formulário de cadastro de Cliente (criar/editar/listar)
- [x] Formulário de cadastro de Equipamento (criar/editar/listar,
      vinculado a um Cliente)
- [x] Tela de edição/desativação de usuário
- [x] Cadastro de Responsável Técnico (campo dentro de Clientes)

## Concluído na Sprint 3

- [x] Listagem de inspeções com filtros e KPIs (`/inspecoes`)
- [x] Nova inspeção — seleção cliente/equipamento (`/inspecoes/novo`)
- [x] Wizard de inspeção em 5 passos (`/inspecoes/[id]/wizard`):
  - [x] Passo 1: Informações (tipo, observações iniciais)
  - [x] Passo 2: Fotografias categorizadas (9 categorias NR-13, drag-and-drop)
  - [x] Passo 3: Medições por ultrassom (grid com status OK/Atenção/Crítico)
  - [x] Passo 4: Observações e recomendações (com 8 templates NR-13)
  - [x] Passo 5: Revisão completa + "Enviar para Aprovação"
- [x] Detalhes da inspeção (`/inspecoes/[id]`) com abas:
  - [x] Visão Geral (resumo, cards de equipamento, status)
  - [x] Fotos (galeria com filtro por categoria)
  - [x] Medições (tabela completa + estatísticas min/max/média)
  - [x] Linha do Tempo (timeline cronológica de todos os eventos)
- [x] Fluxo de aprovação: EM_ANDAMENTO → AGUARDANDO_APROVACAO → APROVADA/REJEITADA
- [x] Permissões: Funcionário executa, Gestor/Admin aprova/rejeita
- [x] APIs: CRUD inspeções, fotos, medições com validações de negócio

## Concluído na Sprint 4

- [x] Módulo `Engineering Engine` isolado em `src/modules/engineering/`
- [x] Arquitetura em camadas: domain / application / calculations / validators / types / constants / utils / services / docs
- [x] Tipos fundamentais: EquipmentData, InspectionData, MeasurementPoint, CalculationInput, CalculationResult, IntegrityAnalysis, SimulationInput/Result
- [x] Value Objects: Thickness, Pressure, Temperature, CorrosionRate
- [x] Entidades de domínio: Equipment, Inspection, MeasurementPointEntity com comportamentos
- [x] Eventos de domínio: EquipmentCreated, InspectionStarted, InspectionSubmittedForApproval, InspectionApproved, InspectionRejected, MeasurementRecorded, IntegrityAnalyzed
- [x] Conversões de unidades CENTRALIZADAS em `utils/units.ts` (pressão, espessura, temperatura, volume, tensão)
- [x] Constantes: THICKNESS_THRESHOLDS, MATERIAL_REFERENCES, FLUID_CLASSES, RISK_GROUPS, NR13_CATEGORIES, DEFAULT_CORROSION_ALLOWANCE, DEFAULT_INSPECTION_INTERVALS, DESIGN_CODES
- [x] Validação robusta: validateEquipmentData, validateInspectionData, validateMeasurements, validateCalculationInput, validateUnitConsistency (detecta MPa vs bar, cm vs mm, in vs mm)
- [x] Calculators (PLACEHOLDERS — aguardam validação do engenheiro):
  - [x] MinimumThicknessCalculator (ASME VIII-1 UG-27, API 650)
  - [x] CorrosionRateCalculator (API 570/510)
  - [x] RemainingLifeCalculator (API 570/510)
  - [x] MawpCalculator (ASME VIII-1 inverso)
- [x] Serviço orquestrador: EngineeringEngineService.analyzeIntegrity() + simulate()
- [x] Casos de uso: AnalyzeIntegrity, CalculateMinimumThickness, CalculateCorrosionRate, CalculateRemainingLife, CalculateMawp, SimulateScenario, ValidateEquipment/Inspection/Measurements
- [x] Factory de casos de uso: EngineeringUseCaseFactory
- [x] Helpers para API: buildCalculationInput, buildCalculationInputFromIds
- [x] Documentação técnica: docs/ENGINEERING_ENGINE.md

## Concluído na Sprint 4.5

- [x] Documento de validação de fórmulas: docs/ENGINEERING_FORMULAS.md (20 cálculos com template padronizado)
- [x] Pasta de exemplos reais: docs/examples/
  - [x] V-101 Petrobras Vaso Pressão (APROVADO)
  - [x] V-401 Braskem Vaso Pressão (REJEITADO)
- [x] Testes unitários vazios aguardando valores oficiais:
  - [x] minimum-thickness.test.ts
  - [x] corrosion-rate.test.ts
  - [x] remaining-life.test.ts
  - [x] mawp.test.ts

## Concluído na Sprint 4.5 (Engineering Studio - Etapas 2-7)

- [x] **Etapa 2 - Header Profissional:**
  - [x] Título "Engineering Studio"
  - [x] Descrição explicativa
  - [x] Breadcrumb (Dashboard / Engineering Studio)
  - [x] Badge "Internal Tool" com indicador pulsante
  - [x] Badge de versão v0.1.0-alpha
  - [x] Build validado

- [x] **Etapa 3 - Layout Principal (Duas Colunas):**
  - [x] Coluna esquerda: Lista de casos reais (1/3 largura)
  - [x] Coluna direita: Área de execução (2/3 largura)
  - [x] Cards com ícones SVG inline
  - [x] Estrutura responsiva (mobile: stack, desktop: grid)
  - [x] Build validado

- [x] **Etapa 4 - Cards de KPIs + Casos Reais:**
  - [x] 4 KPIs superiores: Total (4), Aprovados (1), Em Validação (1), Rejeitados (1)
  - [x] 4 casos reais baseados em `docs/examples/`:
    - V-101 Petrobras (APROVADO)
    - V-401 Braskem (REJEITADO)
    - T-205 Raízen (EM VALIDAÇÃO)
    - C-312 Petrobras (PLACEHOLDER)
  - [x] Cards interativos com métricas (inspeção, taxa corrosão, vida útil, PMTA)
  - [x] Estados hover/focus/seleção
  - [x] Build validado

- [x] **Etapa 5 - Tabela de Casos (Lista Interativa):**
  - [x] Implementada como lista de cards clicáveis na sidebar
  - [x] Mostra: Cliente, Equipamento, Status, Norma, Última revisão
  - [x] Seleção de caso atualiza painéis da direita
  - [x] Build validado

- [x] **Etapa 6 - Painel de Parâmetros (Preparado):**
  - [x] Área contextual que responde à seleção de caso
  - [x] Mensagem orientativa quando nenhum caso selecionado
  - [x] Confirmação visual do caso selecionado
  - [x] Selector de tipo de cálculo (6 tipos)
  - [x] Botão executar com loading state
  - [x] Build validado

- [x] **Etapa 7 - Painel de Resultados (Preparado):**
  - [x] Área contextual que responde à seleção de caso
  - [x] Mensagem orientativa quando nenhum caso selecionado
  - [x] Exibição estruturada: Análise Completa, Simulação, Cálculo Individual
  - [x] Histórico de execuções por caso
  - [x] Error handling amigável
  - [x] Build validado

## Concluído na Sprint 4.5 (Engineering Integration - Milestone 3)

- [x] **Módulo de Integração** `src/modules/engineering/integration/`:
  - [x] `types.ts` — Tipos de integração (EngineeringCase, IntegrationInput, IntegrationResult, FormattedResults)
  - [x] `service.ts` — EngineeringIntegrationService (loadCase, buildCalculationInput, validateInput, runCalculation, runSimulation, formatResult)
  - [x] `index.ts` — Export principal

- [x] **EngineeringIntegrationService funcionalidades:**
  - [x] `loadCase(caseId)` — Carrega 4 casos pré-definidos com dados completos do Engine
  - [x] `getAllCases()` — Lista casos disponíveis
  - [x] `buildCalculationInput(caseId, customParams)` — Constrói CalculationInput usando `buildCalculationInput` do Engine + medições simuladas
  - [x] `validateInput(input)` — Validação completa (dados + consistência de unidades)
  - [x] `runCalculation(input)` — Executa via `EngineeringEngineService.analyzeIntegrity()` ou `simulate()`
  - [x] `runSimulation(input)` — Executa simulação de cenários
  - [x] `formatResult()` — Formata resultados brutos para UI (FormattedCalculationResult, FormattedIntegrityAnalysis, FormattedSimulationResult)

- [x] **Engineering Studio integrado:**
  - [x] Seleção de caso → Preenche automaticamente parâmetros
  - [x] 6 botões de cálculo (Análise Completa, Espessura Mínima, Taxa Corrosão, Vida Útil, PMTA, Simulação)
  - [x] Loading state durante execução
  - [x] Resultados estruturados (status, criticidade, confiabilidade, norma, observações)
  - [x] Histórico de execuções por caso
  - [x] Placeholders mantidos — Calculators ainda usam fórmulas placeholder

- [x] Build validado — `/engineering` 17.1 kB (integração completa)

## MVP Concluído ✅

Todas as funcionalidades do MVP estão implementadas e validadas.

## Melhorias futuras (pós-MVP)

- [ ] Exportação PDF/Word dos laudos
- [ ] Assinatura digital dos responsáveis técnicos
- [ ] Portal do cliente final
- [ ] Integração com WhatsApp / E-mail para alertas
- [ ] Mapa inteligente de inspeção (cilindro desenrolado clicável)
- [ ] Modelos de laudo por tipo de equipamento
- [ ] Integração com robô de medição por ultrassom
- [ ] Multi-empresa (multi-tenant) / SaaS
- [ ] Suporte offline completo (fase 2)

## Dívidas técnicas conhecidas

- [ ] Definir política de rotação do `AUTH_SECRET` em produção
- [ ] Avaliar rate limiting no endpoint de login

## Concluído na Sessão 29-30/07/2026 — MVP Final

- [x] Schema: adicionar type, notes, recommendations, city, state, corrosionAllowanceMm
- [x] Wizard: corrigir carregamento, navegação entre passos, save measurements batch
- [x] Pipeline API: POST /api/reports/pipeline (Inspection → Engine → Report)
- [x] Gerar Laudo Técnico: botão no wizard step 5
- [x] Workspace de Laudos: /reports/[id] consumindo TechnicalReport real
- [x] Listagem de Laudos: /laudos com tabela e busca
- [x] StorageService: interface abstrata + provider Vercel Blob
- [x] CameraCapture: câmera direta sem galeria, compressão automática
- [x] Validades: dashboard, calendário, alertas 90/60/30d
- [x] API /api/validades: dados reais do banco
- [x] Service Worker: cache-first + network-first + background sync
- [x] Manifest PWA: instalação como aplicativo
- [x] Offline Sync: IndexedDB, fila, retry automático
- [x] BUILD PASS: 0 erros TypeScript, 35+ rotas