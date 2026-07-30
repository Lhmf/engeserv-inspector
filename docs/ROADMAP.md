# ROADMAP.md

Cada fase deve ser pequena e testável. Marque `[x]` quando concluída e
registre a data em `CHANGELOG.md`.

## Sprint 1 — Estrutura base ✅ (entregue nesta rodada)

- [x] Autenticação de usuários (login/logout via cookie de sessão)
- [x] Layout responsivo com sidebar e topbar
- [x] Dashboard inicial (KPIs reais de clientes/equipamentos/usuários)
- [x] Banco de dados (Prisma + SQLite local) com modelos de User, Client,
      Equipment
- [x] Navegação entre os módulos (placeholders para os módulos futuros)
- [x] Script de seed do primeiro Administrador Master
- [x] Módulo de Usuários funcional (criação de Gestor/Funcionário com
      checagem de permissão)
- [x] Deploy configurado para Vercel + instruções de rodar em localhost
- [ ] Tema claro/escuro (opcional — não incluído nesta rodada)

## Sprint 2 — Cadastro ✅

- [x] Cadastro completo de Clientes (formulário + listagem + edição)
- [x] Cadastro completo de Equipamentos (vinculado a um cliente)
- [x] Cadastro de Responsáveis Técnicos
- [x] Refinar tela de Usuários (edição, desativação)

## Sprint 3 — Inspeções ✅

- [x] Cadastro de inspeções vinculadas a um equipamento
- [x] Upload de fotos (categorizadas: placa, corrosão, válvula, manômetro,
      ultrassom, vista geral, solda, trinca, reparo)
- [x] Registro de medições (mapa de pontos de ultrassom)
- [x] Histórico de inspeções por equipamento (linha do tempo)
- [x] Wizard de inspeção em 5 passos (Informações, Fotos, Medições, Observações, Revisão)
- [x] Página de detalhes com abas (Visão Geral, Fotos, Medições, Linha do Tempo)
- [x] Fluxo de aprovação: EM_ANDAMENTO → AGUARDANDO_APROVACAO → APROVADA/REJEITADA
- [x] Permissões: Funcionário executa, Gestor/Admin aprova/rejeita

## Sprint 4 — Motor de Cálculos (Infraestrutura ✅ / Fórmulas ⏳ / Engineering Studio ✅)

- [x] **Infraestrutura do Motor de Engenharia** (módulo isolado `src/modules/engineering/`):
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

- [x] **Sprint 4.5 — Engineering Validation**:
  - [x] Documento de validação de fórmulas: docs/ENGINEERING_FORMULAS.md (20 cálculos com template padronizado)
  - [x] Pasta de exemplos reais: docs/examples/
    - [x] V-101 Petrobras Vaso Pressão (APROVADO)
    - [x] V-401 Braskem Vaso Pressão (REJEITADO)
  - [x] Testes unitários vazios aguardando valores oficiais:
    - [x] minimum-thickness.test.ts
    - [x] corrosion-rate.test.ts
    - [x] remaining-life.test.ts
    - [x] mawp.test.ts

- [x] **Sprint 4.5 — Engineering Studio (Recriação Inicial)**:
  - [x] Recriar página Engineering Studio do zero (`src/app/(app)/engineering/page.tsx`)
  - [x] Página mínima: `<main><h1>Engineering Studio</h1></main>`
  - [x] Build passando sem erros
  - [x] Header do Engineering Studio (breadcrumb, título, badges)
  - [x] Cards de KPIs (Totais, Aprovados, Em Validação, Rejeitados)
  - [x] Layout duas colunas (Sidebar casos + Área execução)
  - [x] Lista interativa de casos reais (4 casos de docs/examples/)
  - [x] Seleção de caso atualiza painéis da direita
  - [x] Painel de Parâmetros (selector 6 tipos de cálculo + botão executar + loading)
  - [x] Painel de Resultados (Análise Completa, Simulação, Cálculo Individual + histórico + error handling)

- [x] **Sprint 4.5 — Engineering Integration (Milestone 3)**:
  - [x] Módulo `src/modules/engineering/integration/` (types.ts, service.ts, index.ts)
  - [x] EngineeringIntegrationService (loadCase, buildCalculationInput, validateInput, runCalculation, runSimulation, formatResult)
  - [x] 4 casos pré-definidos com dados completos do Engine (V-101, V-401, T-205, C-312)
  - [x] Integração UI → Engine funcional (seleção caso → parâmetros → execução → resultados)
  - [x] Placeholders mantidos nos calculators (aguardam validação engenheiro)

- [ ] **Implementar fórmulas da NR-13** (após validação do engenheiro responsável no `NR13_BUSINESS_RULES.md`):
  - [ ] Espessura mínima admissível (casco cilíndrico, esférico, elipsoidal, torisférico, cônico)
  - [ ] Pressão admissível / de trabalho / de projeto
  - [ ] Taxa de corrosão (mm/ano) — método de cálculo a partir de espessura original x atual x tempo de operação
  - [ ] Vida útil remanescente
  - [ ] Coeficiente de segurança e margem operacional
  - [ ] Regra de negócio já indicada informalmente: a "camisa" do cilindro deve manter coeficiente de segurança compatível com espessura mínima acima de **2,5 mm**, desconsiderando corrosão adicional — **confirmar com o responsável técnico se esse valor é fixo para todos os equipamentos ou varia por tipo/norma antes de codificar como constante**

- [ ] Validação de entradas
- [ ] Geração automática de resultados a partir das medições

## Sprint 5 — Geração do Laudo ✅

- [x] Layout profissional EngeServ (cabeçalho navy, cliente, equipamento, parâmetros)
- [x] Preenchimento automático dos campos a partir do banco (via Pipeline → TechnicalReport)
- [x] Workspace de laudos com 10 seções (resumo, inspeção, fotos, medições, engenharia, conclusão, recomendações, anexos, histórico, assinaturas)
- [x] Versionamento do documento
- [x] Fluxo de aprovação (Rascunho → Revisão → Aprovado → Publicado)
- [ ] Exportação em PDF (estrutura preparada)
- [ ] Exportação em Word (estrutura preparada)

## Sprint 6 — Gestão de Vencimentos ✅

- [x] Dashboard de validade (laudos ativos, vencendo, vencidos)
- [x] Calendário de vencimentos (clique no dia → laudos daquele dia)
- [x] Filtros por cliente, equipamento e data
- [x] Alertas de vencimento (90/60/30 dias + vencido)
- [ ] Alertas via e-mail/WhatsApp (arquitetura preparada)

## Sprint 7 — Offline First ✅

- [x] Service Worker com cache-first (assets) e network-first (API)
- [x] Manifest PWA (instalação como aplicativo)
- [x] IndexedDB para cache local de inspeções, equipamentos, clientes
- [x] Fila de sincronização automática com retry
- [x] Background Sync para upload offline
- [x] Detecção de conectividade com fallback automático

## Sprint 8 — Fotos em Nuvem ✅

- [x] Interface StorageService abstrata (Vercel Blob / Supabase / S3 / R2)
- [x] Upload automático com compressão
- [x] CameraCapture (abre câmera direto, sem galeria)
- [x] Organização por categorias NR-13 (9 categorias)
- [x] Funcionamento offline com fila de sincronização

## MVP Concluído ✅
- [ ] Mapa inteligente de inspeção (cilindro desenrolado, clicável)
- [ ] Modelos de laudo por tipo de equipamento (vaso, caldeira, tubulação...)
- [ ] Assinatura digital dos responsáveis técnicos
- [ ] Integração com robô de medição por ultrassom
- [ ] Portal do cliente final (possível produto à parte)
- [ ] Suporte offline em campo com sincronização
- [ ] Evolução para multi-tenant / SaaS