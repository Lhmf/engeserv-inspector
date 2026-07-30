# CHANGELOG.md

Todas as entregas do projeto, em ordem cronológica. Atualize a cada
sessão de trabalho concluída.

## 19/07/2026 — Sprint 1: Estrutura base

- Criado o projeto Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- Criado o schema inicial do banco de dados (Prisma): `User`, `Client`,
  `Equipment`.
- Implementada autenticação própria (sessão via cookie httpOnly assinado
  com JWT), com três papéis: Administrador Master, Gestor e Funcionário.
- Implementado middleware de proteção de rotas.
- Criado script de seed para o primeiro Administrador Master (usa o
  `MANAGEMENT_CODE` apenas nesse momento único).
- Criado layout autenticado com sidebar (navegação por módulo) e topbar
  (usuário logado + logout).
- Criado dashboard inicial com KPIs reais de clientes, equipamentos e
  usuários (KPIs de laudos/validades aguardando Sprint 5/6).
- Criado módulo de Usuários funcional: Admin Master cria Gestor;
  Admin Master ou Gestor criam Funcionário — com checagem de permissão no
  backend, não apenas na interface.
- Criadas páginas placeholder para Clientes, Equipamentos, Inspeções,
  Laudos, Validades e Configurações, cada uma indicando em qual sprint
  futura será implementada.
- Escrita a documentação viva do projeto: `PROJECT_RULES.md`,
  `ARCHITECTURE.md`, `ROADMAP.md`, `TODO.md`, `NR13_BUSINESS_RULES.md`.
- Configurado para deploy na Vercel e para rodar em `localhost`
  (instruções completas em `README.md`).

## 20/07/2026 — Sprint 2: Cadastro de Clientes e Equipamentos

**Entregas:**

- **Clientes (CRUD completo):**
  - Listagem em `/clientes` com tabela (empresa, CNPJ, responsável, equipamentos, status, data)
  - Cadastro em `/clientes/novo` com formulário: razão social, CNPJ (formatação automática), endereço, contato (nome, telefone, email), responsável técnico (select com Gestores ativos)
  - API `/api/clientes` (GET lista, POST cria) + `/api/clientes/[id]` (GET detalhe, PUT atualiza, DELETE desativa)
  - Validações: CNPJ único (14 dígitos), email válido, responsável deve ser Gestor ativo
  - Soft delete: desativa cliente só se não tiver equipamentos ativos

- **Equipamentos (CRUD completo):**
  - Listagem em `/equipamentos` com filtro por cliente (TAG, tipo, cliente, descrição, data)
  - Cadastro em `/equipamentos/novo` com formulário: cliente (select), TAG (única por cliente), tipo (enum NR-13), descrição, fabricante, ano, pressão de projeto, espessura original, espessura mínima
  - API `/api/equipamentos` (GET lista com filtro opcional clientId, POST cria)
  - Validações: TAG única por cliente, cliente ativo, tipos conforme NR-13

- **Responsável Técnico:** campo `responsibleId` no Cliente vinculando a usuários com role GESTOR ativo

- **Usuários:** refinada tela `/usuarios` mantendo criação com permissão (Admin Master cria Gestor/Funcionário, Gestor cria Funcionário)

**Arquitetura:** mesmo padrão visual e de componentes do módulo Usuários (NewUserForm → NewClientForm/NewEquipmentForm, tabelas consistentes, formulários em grid responsivo, validações Zod, permissões via `src/lib/auth.ts`)

**Deploy:** Vercel automático via push no GitHub; banco Supabase Postgres com migração `active` em Client e Equipment

**Problema:** Existia rota pública `/cadastrar` e endpoint `/api/auth/register`
acessíveis sem autenticação, permitindo que qualquer pessoa criasse contas de
Funcionário (sem código) ou Gestor (informando o `MANAGEMENT_CODE`). Isso
contradizia o `PROJECT_RULES.md`: apenas Admin Master cria Gestor; apenas Admin
Master ou Gestor (autenticados) criam Funcionário.

**Ação corretiva:**
1. Removida página pública `/cadastrar` (redireciona para `/login`).
2. Removido endpoint público `/api/auth/register` (retorna 410 Gone).
3. Removido link "Cadastrar" da tela de login.
4. Criação de usuários mantida exclusivamente na tela autenticada `/usuarios`,
   com checagem de permissão via `canCreateGestor` / `canCreateFuncionario` em
   `src/lib/auth.ts`.

**Contas criadas indevidamente pelo formulário público (identificadas em
20/07/2026):**
- `testegestor@exemplo.com` (GESTOR) — criada em 03:24
- `testefunc@exemplo.com` (FUNCIONARIO) — criada em 03:24
- `br4energia.luiz@gmail.com` (GESTOR) — criada em 12:28 (possivelmente com
  código de gerência)

**Recomendação:** Admin Master deve revisar essas contas em `/usuarios` e
desativar/remover as de teste. Trocar `MANAGEMENT_CODE` e `AUTH_SECRET` nas
Environment Variables da Vercel (previsto para ser feito manualmente pelo
responsável).

## 21/07/2026 — Sprint 3: Fluxo Completo de Inspeções

**Entregue:** Fluxo completo de inspeções NR-13 — do cadastro à aprovação.

### Páginas e Componentes

- **Listagem de Inspeções (`/inspecoes`):**
  - Tabela com TAG, equipamento/cliente, inspetor, data, status, medições, fotos
  - Filtros por busca (TAG, cliente, inspetor) e status
  - KPIs: Total, Em Andamento, Aguardando Aprovação, Aprovadas, Rejeitadas
  - Ações: "Ver Detalhes" (olho) e "Continuar Wizard" (prancheta)

- **Nova Inspeção (`/inspecoes/novo`):**
  - Seleção de cliente (dropdown) → equipamentos do cliente (dropdown)
  - Cria inspeção via API e redireciona para wizard passo 1

- **Wizard de Inspeção em 5 Passos (`/inspecoes/[id]/wizard`):**
  - **Passo 1 - Informações**: Tipo (Inicial/Periódica/Extraordinária), observações iniciais
  - **Passo 2 - Fotografias**: Upload categorizado (9 categorias NR-13: PLACA, CORROSAO, VALVULA, MANOMETRO, ULTRASSOM, VISTA_GERAL, SOLDA, TRINCA, REPARO) com drag-and-drop
  - **Passo 3 - Medições**: Grid de pontos de ultrassom (ponto, espessura mm, ângulo, notas) com status automático (OK/Atenção/Crítico) baseado na espessura mínima do equipamento
  - **Passo 4 - Observações**: Texto livre + recomendações (com 8 templates clicáveis NR-13)
  - **Passo 5 - Revisão**: Resumo completo (dados, fotos por categoria, estatísticas de medições, observações) + botão "Enviar para Aprovação"
  - Barra de progresso visual com 5 etapas coloridas
  - Auto-save ao trocar de passo
  - Navegação Próximo/Voltar com URL sincronizada (`?step=`)

- **Detalhes da Inspeção (`/inspecoes/[id]`):**
  - Header com TAG, tipo, cliente, inspetor, status badge, progresso visual
  - Menu de ações contextual por status:
    - EM_ANDAMENTO: "Enviar para Aprovação", "Continuar Wizard"
    - AGUARDANDO_APROVACAO: "Aprovar", "Rejeitar", "Continuar Wizard"
    - REJEITADA: "Reabrir Inspeção"
    - APROVADA: apenas visualização
  - Abas:
    - **Visão Geral**: Cards de equipamento, resumo (fotos, medições, espessura média/mínima, status final), motivo de rejeição se houver
    - **Fotos**: Galeria em grid com filtro por categoria, preview, download
    - **Medições**: Tabela completa com status por ponto (OK/Atenção/Crítico), cards de resumo (mín/max/média), comparação com espessura mínima de projeto
    - **Linha do Tempo**: Timeline cronológica de todos os eventos (criação, fotos, medições, conclusão, aprovação/rejeição) com ícones e cores por tipo

### APIs

- `GET/POST /api/inspections` — listar/criar inspeções
- `GET/PUT/DELETE /api/inspections/[id]` — detalhar, atualizar status, cancelar
- `GET/POST /api/inspections/[id]/photos` — listar/upload fotos categorizadas
- `GET/POST /api/inspections/[id]/measurements` — listar/criar medições de ultrassom
- Validações de transição de status (EM_ANDAMENTO → AGUARDANDO_APROVACAO → APROVADA/REJEITADA; REJEITADA → EM_ANDAMENTO)
- Permissões: Funcionário executa; Gestor/Admin aprova/rejeita

### Banco de Dados (Prisma)

- Modelos: `Inspection`, `InspectionPhoto`, `InspectionMeasurement`
- Enums: `InspectionStatus`, `PhotoCategory`, `EquipmentType`
- Relacionamentos: Inspection → Equipment, Inspector, ApprovedBy, Photos[], Measurements[]
- Índices compostos e constraints de integridade

### UX/UI

- Componentes reutilizáveis: `StatCard`, `Badge`, `Button`, `EmptyState`, `Breadcrumbs`, `Skeleton`
- Progress bar visual no wizard e na página de detalhes
- Status badges coloridos (azul/âmbar/verde/rosa)
- Medições com indicador visual OK/Atenção/Crítico baseado na espessura mínima
- Templates de recomendação NR-13 pré-carregados (clique para adicionar)
- Responsivo (mobile-first) com sidebar colapsável

### Próximos passos (Sprint 4+)

- Motor de cálculos NR-13 (espessura mínima, pressão admissível, taxa de corrosão, vida útil, coeficiente de segurança) — módulo isolado em `src/modules/engineering/`
- Geração de PDF/Word do laudo (layout oficial EngeServ)
- Calendário de validades e alertas de vencimento

## 21/07/2026 — Sprint 4: Engineering Engine (Infraestrutura)

**Entregue:** Infraestrutura completa do módulo `Engineering Engine` — motor isolado para todos os cálculos técnicos NR-13/ASME/API. **NÃO IMPLEMENTA FÓRMULAS DEFINITIVAS** — placeholders aguardam validação do engenheiro responsável conforme `NR13_BUSINESS_RULES.md`.

### Arquitetura do Módulo (`src/modules/engineering/`)

```
src/modules/engineering/
├── domain/                 # Regras de negócio puras (entidades, value objects, eventos)
│   ├── entities.ts         # Equipment, Inspection, Measurement, Material
│   ├── value-objects.ts    # Thickness, Pressure, Temperature, CorrosionRate
│   └── events.ts           # Domain events (EquipmentCreated, InspectionApproved...)
├── application/            # Casos de uso (Use Cases)
│   └── use-cases.ts        # AnalyzeIntegrity, CalculateMinimumThickness, CalculateCorrosionRate, CalculateRemainingLife, CalculateMawp, SimulateScenario, Validate*
├── calculations/           # Implementações dos cálculos (Calculators)
│   ├── minimum-thickness.ts   # t_min (ASME VIII-1 UG-27, API 650)
│   ├── corrosion-rate.ts      # Taxa de corrosão (API 570/510)
│   ├── remaining-life.ts      # Vida útil remanescente
│   ├── mawp.ts                # PMTA baseada na espessura atual
│   └── index.ts               # Exporta todos + factory
├── validators/             # Validação de entradas
│   └── index.ts            # validateEquipmentData, validateInspectionData, validateMeasurements, validateCalculationInput, validateUnitConsistency
├── types/                  # TypeScript interfaces
│   └── index.ts            # EquipmentData, InspectionData, CalculationInput, CalculationResult, IntegrityAnalysis, SimulationInput/Result...
├── constants/              # Constantes, thresholds, materiais de referência
│   └── index.ts            # THICKNESS_THRESHOLDS, MATERIAL_REFERENCES, FLUID_CLASSES, RISK_GROUPS, NR13_CATEGORIES, DEFAULT_CORROSION_ALLOWANCE, DEFAULT_INSPECTION_INTERVALS, DESIGN_CODES
├── utils/                  # Utilitários puros
│   └── units.ts            # CONVERSÕES CENTRALIZADAS (único lugar para conversão de unidades)
├── services/               # Serviços de aplicação
│   └── engine.ts           # EngineeringEngineService (orquestra análise completa)
├── hooks/                  # React hooks (futuro)
├── components/             # Componentes UI específicos (futuro)
└── docs/                   # Documentação técnica
    └── ENGINEERING_ENGINE.md
```

### Funcionalidades Implementadas

#### 1. Tipos Fundamentais (`types/index.ts`)
- `EquipmentData`, `InspectionData`, `MeasurementPoint` — espelho do banco
- `CalculationInput` — entrada unificada para todos os cálculos
- `CalculationResult<T>` — **resultado padrão** de TODO cálculo:
  - `value` (valor), `unit` (unidade), `status` (SUCCESS/WARNING/ERROR/INSUFFICIENT_DATA/NOT_APPLICABLE)
  - `criticality` (LOW/MEDIUM/HIGH/CRITICAL/NOT_ASSESSED)
  - `explanation` (texto), `normativeReference` (ex: "ASME VIII-1 UG-27 / NR-13 13.5.2")
  - `reliability` (HIGH/MEDIUM/LOW/THEORETICAL)
  - `observations` (string[]), `metadata` (rastreabilidade: calculationId, calculatedAt, calculatedBy, formulaVersion, normativeVersion, inputs, warnings)
- `CorrosionData`, `MaterialData`, `OperatingConditions`
- `IntegrityAnalysis` — análise completa: status geral (INTEGRO/ACEITÁVEL_COM_RESTRIÇÕES/REQUER_REPARO/CONDENADO/INDETERMINADO), criticidade, recomendações, fatores de risco
- `SimulationInput`/`SimulationResult` — projeção de cenários
- `ValidationResult` — validação estruturada com erros/warnings/campos faltando

#### 2. Conversões de Unidades Centralizadas (`utils/units.ts`)
- **Regra de Ouro**: NUNCA fazer conversão fora deste módulo
- Pressão: bar ↔ MPa ↔ psi ↔ kgf/cm² ↔ kPa
- Espessura: mm ↔ cm ↔ m ↔ in ↔ ft
- Temperatura: °C ↔ °F ↔ K
- Volume: L ↔ m³ ↔ gal ↔ ft³
- Tensão: MPa ↔ psi ↔ kgf/cm² ↔ kPa
- Funções de conveniência: `toBar()`, `fromBar()`, `toMm()`, `fromMm()`, `toCelsius()`, `fromCelsius()`, `formatPressure()`, `formatLength()`, etc.
- Validadores de unidade: `isValidPressureUnit()`, `isValidLengthUnit()`, etc.

#### 3. Constantes e Referências (`constants/index.ts`)
- `THICKNESS_THRESHOLDS`: mínimo absoluto 2.5mm, crítico ≤100% do mínimo, atenção ≤120%
- `MATERIAL_REFERENCES`: SA-516 Gr.70/60, SA-36, SA-240 316L/304L, A-36 com tensões admissíveis por temperatura
- `FLUID_CLASSES` (A/B/C/D), `RISK_GROUPS` (1-4), `NR13_CATEGORIES` (I-V)
- `DEFAULT_CORROSION_ALLOWANCE_MM` por tipo de equipamento
- `DEFAULT_INSPECTION_INTERVALS_MONTHS` por tipo
- `DESIGN_CODES`, `HEAD_TYPES`

#### 4. Validação Robusta (`validators/index.ts`)
- `validateThicknessMm()`, `validatePressureBar()`, `validateTemperatureC()`, `validateOperatingTimeYears()`
- `validateJointEfficiency()` (0 < E ≤ 1, valores padrão 1.0/0.85/0.7)
- `validateCorrosionAllowance()`, `validateSafetyFactor()`
- `validateEquipmentData()` — verifica dados mínimos NR-13, consistência t_min < t_original, P_op ≤ P_projeto, MAWP ≤ P_projeto
- `validateInspectionData()`, `validateMeasurementPoint()`, `validateMeasurements()` (detecta pontos duplicados)
- `validateCalculationInput()` — validação completa do input unificado
- `validateUnitConsistency()` — **detecta unidades erradas automaticamente**:
  - MPa em vez de bar (valores 10x menores)
  - cm em vez de mm (valores 10x menores)
  - polegadas em vez de mm (valores ~25x menores)

#### 5. Calculators (PLACEHOLDERS — Aguardam Validação do Engenheiro)
| Calculator | Fórmula de Referência | Status |
|------------|----------------------|--------|
| `MinimumThicknessCalculator` | ASME VIII-1 UG-27: t = (P×R)/(S×E - 0.6×P) + Ca; API 650 | ⚠️ Placeholder |
| `CorrosionRateCalculator` | API 570/510: CR = (t_ant - t_atual) / Δt; regressão linear | ⚠️ Placeholder |
| `RemainingLifeCalculator` | Vida = (t_atual - t_mínima) / taxa_corrosão | ⚠️ Placeholder |
| `MawpCalculator` | ASME VIII-1 inverso: P = (S×E×t)/(R + 0.6×t) | ⚠️ Placeholder |

Todos retornam `status: 'WARNING'`, `reliability: 'THEORETICAL'` e observação `"IMPLEMENTAÇÃO PLACEHOLDER - NÃO USAR EM PRODUÇÃO"`.

#### 6. Serviço Orquestrador (`services/engine.ts`)
- `EngineeringEngineService.analyzeIntegrity(input)` — executa análise completa:
  1. Valida entrada + consistência de unidades
  2. Encontra menor espessura medida
  3. Obtém tensão admissível do material (interpolação por temperatura)
  4. Estima diâmetro interno (se não informado, usa volume)
  5. Executa: t_min → taxa corrosão (se há inspeção anterior) → vida útil → PMTA
  6. Determina status geral: INTEGRO / ACEITÁVEL_COM_RESTRIÇÕES / REQUER_REPARO / CONDENADO / INDETERMINADO
  7. Gera recomendações e fatores de risco automaticamente
  8. Registra log de auditoria completo
- `EngineeringEngineService.simulate(input)` — projeção de cenários (condições atuais, pressão aumentada, temperatura aumentada, corrosão acelerada, custom)

#### 7. Camada de Domínio (`domain/`)
- **Entidades ricas**: `Equipment`, `Inspection`, `MeasurementPointEntity` com comportamentos (canBeEdited, canBeSubmittedForApproval, evaluateThicknessStatus, getThicknessMarginPercent...)
- **Value Objects**: `Thickness`, `Pressure`, `Temperature`, `CorrosionRate` com validação e conversões embutidas
- **Eventos de domínio**: `EquipmentCreatedEvent`, `InspectionStartedEvent`, `InspectionSubmittedForApprovalEvent`, `InspectionApprovedEvent`, `InspectionRejectedEvent`, `MeasurementRecordedEvent`, `IntegrityAnalyzedEvent`

#### 8. Casos de Uso (`application/use-cases.ts`)
- `AnalyzeEquipmentIntegrityUseCase`, `CalculateMinimumThicknessUseCase`, `CalculateCorrosionRateUseCase`, `CalculateRemainingLifeUseCase`, `CalculateMawpUseCase`, `SimulateScenarioUseCase`, `ValidateEquipmentForCalculationUseCase`, `ValidateInspectionForCalculationUseCase`, `ValidateMeasurementsForCalculationUseCase`
- Factory `EngineeringUseCaseFactory` para injeção de dependência

#### 9. Helpers para API (`index.ts`)
- `buildCalculationInput(equipment, inspection, measurements, options)` — monta input a partir de dados do Prisma
- `buildCalculationInputFromIds(equipmentId, inspectionId, prisma)` — versão async que busca no banco e encontra inspeção anterior para taxa de corrosão

#### 10. Documentação (`docs/ENGINEERING_ENGINE.md`)
- Arquitetura completa, modelagem, fluxos, como adicionar novo cálculo, checklist para validação do engenheiro

### Princípios Seguidos (conforme `PROJECT_RULES.md`)

✅ **Nunca misturar regra de negócio com interface** — motor 100% isolado em `src/modules/engineering/`  
✅ **Nunca duplicar código** — conversões centralizadas em `utils/units.ts`  
✅ **Componentes pequenos e reutilizáveis** — calculators independentes, value objects reutilizáveis  
✅ **Não criar cálculos NR-13 sem validação do engenheiro** — todos placeholders com warnings explícitos  
✅ **Todo cálculo retorna objeto estruturado** — `CalculationResult<T>` padronizado  
✅ **Logs de auditoria** — calculationId, calculatedAt, calculatedBy, formulaVersion, normativeVersion, inputs, results  
✅ **Documentação viva** — `ENGINEERING_ENGINE.md` explica arquitetura, fluxo, objetos, expansão futura

### Próximos Passos (Pós-Validação do Engenheiro)

1. **Engenheiro valida `NR13_BUSINESS_RULES.md`** com fórmulas, parâmetros, thresholds
2. **Engenheiro preenche `docs/ENGINEERING_FORMULAS.md`** (todos os 20 cálculos)
3. **Substituir placeholders** em `calculations/*.ts` por implementações validadas
4. **Remover `status: 'WARNING'` e `reliability: 'THEORETICAL'`** dos cálculos validados
5. **Adicionar testes** com casos conhecidos (hand calculations)
6. **Integrar na API** — endpoint `/api/engineering/analyze` para análise sob demanda
7. **Integrar no Wizard** — mostrar resultados em tempo real no passo 3/5
8. **Integrar no Laudo (Sprint 5)** — preencher seções técnicas automaticamente

---

## 22/07/2026 — Sprint 4.5: Engineering Studio (Evolução Incremental - Etapas 2-4)

**Entregue:** Evolução incremental do **Engineering Studio** completando as etapas 2 a 4 da estratégia definida.

### Etapas Concluídas

#### Etapa 2 - Header Profissional ✅
- Breadcrumb navegável (Dashboard → Engineering Studio)
- Título "Engineering Studio" com descrição
- Badge "Internal Tool" com indicador pulsante
- Badge de versão "v0.1.0-alpha"
- Layout responsivo (mobile-first)

#### Etapa 3 - Layout Principal Duas Colunas ✅
- **Coluna Esquerda (1/3):** Sidebar com lista de casos reais
- **Coluna Direita (2/3):** Área de execução com dois painéis empilhados
  - Painel de Parâmetros de Cálculo
  - Painel de Resultados da Execução
- Cards com ícones SVG inline (sem dependências externas)
- Estrutura preparada para seleção de caso

#### Etapa 4 - Cards de KPIs + Casos Reais ✅
- **4 KPIs superiores:**
  - Casos Totais (4)
  - Aprovados (1) - verde
  - Em Validação (1) - âmbar
  - Rejeitados (1) - rosa
- **Lista de 4 casos reais** baseados em `docs/examples/`:
  - V-101 Petrobras (APROVADO) - Taxa 0.133 mm/ano, Vida 37.6 anos, PMTA 22.38 bar
  - V-401 Braskem (REJEITADO) - Taxa 0.45 mm/ano, Vida 2.1 anos, PMTA 4.13 bar
  - T-205 Raízen (EM VALIDAÇÃO) - Taxa 0.089 mm/ano, Vida 45.2 anos
  - C-312 Petrobras (PLACEHOLDER) - Sem dados calculados
- **Cards interativos** com:
  - Indicador de status colorido
  - TAG, Cliente, Equipamento
  - Métricas: Última inspeção, Taxa de corrosão, Vida útil
  - PMTA quando disponível
  - Estados hover/focus/seleção

### Build
- ✅ **Todas as etapas validadas com `npm run build`**
- Rota `/engineering` funcional (3.03 kB First Load JS)

### Próximas Etapas
5. **Painel de Parâmetros** (formulário completo com validação)
6. **Painel de Resultados** (visualização estruturada + histórico)

---

## 26/07/2026 — Sprint 3: Correções RC1 (Estabilização)

**Entregue:** Correções de TypeScript, integração de storage para fotos e
CRUD de textos padrão.

### Correções de Build

- **Fix:** Acesso à propriedade privada `reportEntity.report.id` → `reportEntity.toJSON().id`
  em `src/modules/report/pipeline/service.ts`
- **Fix:** Importação ausente de `MeasurementPoint` no pipeline de laudos
- **Fix:** Duplicação do método `buildResult` (sincrono e assíncrono) removida
- **Fix:** Duplicação do campo `calculationInput` na interface `PipelineStepData`
- **Fix:** Importação incorreta de `TechnicalReportEntity` em `pipeline/types.ts`
- ✅ **Build passando** (`npm run build`)

### Upload de Fotos (Vercel Blob)

- **Integração Vercel Blob:** Rota `POST /api/inspections/[id]/photos` agora
  faz upload real para Vercel Blob, com fallback para placeholder quando
  `BLOB_READ_WRITE_TOKEN` não estiver configurado.
- Armazenamento: `inspections/{inspectionId}/{categoria}-{timestamp}-{filename}`
- Dependência adicionada: `@vercel/blob`

### CRUD de Textos Padrão

- **Criada** página `/configuracoes/textos/novo` — formulário de criação
  de textos padrão (recomendações, avisos, conclusões)
- **Criada** página `/configuracoes/textos/[id]/editar` — formulário de
  edição com campos: código, título, conteúdo, categoria, ativo/inativo
- Links quebrados em `/configuracoes` agora funcionam corretamente
- ✅ **Build passando**

### Documentação

- CHANGELOG.md atualizado com esta sessão
- ROADMAP.md e CHANGELOG.md sincronizados

---

## 22/07/2026 — Sprint 4.5: Engineering Integration (Milestone 3)

**Entregue:** Integração completa entre **Engineering Studio (UI)** e **Engineering Engine** via nova camada de integração.

### Camada de Integração Criada
**Módulo:** `src/modules/engineering/integration/`

```
src/modules/engineering/integration/
├── types.ts      # Tipos de integração (EngineeringCase, IntegrationInput, IntegrationResult, FormattedResults)
├── service.ts    # EngineeringIntegrationService (loadCase, buildCalculationInput, validateInput, runCalculation, runSimulation, formatResult)
└── index.ts      # Export principal
```

### Funcionalidades Implementadas

#### EngineeringIntegrationService
1. **`loadCase(caseId)`** — Carrega caso pré-definido (V-101, V-401, T-205, C-312) com dados completos do Engine
2. **`getAllCases()`** — Lista todos os casos disponíveis
3. **`buildCalculationInput(caseId, customParams)`** — Constrói `CalculationInput` completo a partir do caso, usando `buildCalculationInput` do Engine + medições simuladas
4. **`validateInput(input)`** — Validação completa (dados + consistência de unidades)
5. **`runCalculation(input)`** — Executa cálculos via `EngineeringEngineService.analyzeIntegrity()` ou `simulate()`
6. **`runSimulation(input)`** — Executa simulação de cenários
7. **`formatResult(rawResult, type)`** — Formata resultados brutos do Engine para UI (FormattedCalculationResult, FormattedIntegrityAnalysis, FormattedSimulationResult)

#### Casos Pré-definidos com Dados Completos
- **V-101 Petrobras** — Vaso pressão, ASME VIII-1, SA-516 Gr.70, P=20bar, t=12mm, E=1.0
- **V-401 Braskem** — Vaso pressão, ASME VIII-1, SA-516 Gr.70, P=10bar, t=10mm, E=1.0 (REJEITADO)
- **T-205 Raízen** — Tanque API 650, SA-36, P=1.03bar, t=12mm, E=0.85
- **C-312 Petrobras** — Caldeira ASME I, SA-516 Gr.70, P=15bar, t=16mm, E=1.0

### Engineering Studio Atualizado
- **Seleção de caso** → Preenche automaticamente painel de parâmetros
- **Botões de cálculo** (Análise Completa, Espessura Mínima, Taxa Corrosão, Vida Útil, PMTA, Simulação)
- **Loading state** durante execução
- **Exibição estruturada de resultados:**
  - Análise de Integridade: Status geral, criticidade, recomendações, fatores de risco, 4 cálculos individuais
  - Simulação: Espessura projetada, vida útil, data estimada, intervalo inspeção
  - Cálculo individual: Valor, unidade, status, criticidade, confiabilidade, norma
- **Histórico de execuções** por caso
- **Error handling** com mensagens amigáveis
- **Placeholders mantidos** — Calculators ainda usam fórmulas placeholder (WARNING, THEORETICAL)

### Build
- ✅ **Build validado** — `/engineering` agora 17.1 kB (integração completa)
- ✅ TypeScript strict — 0 erros
- ✅ Zero novas dependências externas (UUID generator inline)

### Arquivos Criados/Alterados
- **Criados:**
  - `src/modules/engineering/integration/types.ts`
  - `src/modules/engineering/integration/service.ts`
  - `src/modules/engineering/integration/index.ts`
- **Alterados:**
  - `src/app/(app)/engineering/page.tsx` — Integração completa com UI funcional

---

## 22/07/2026 — Sprint 4.5: Engineering Studio (Recriação Inicial)

**Entregue:** Recriação completa do módulo **Engineering Studio** do zero, substituindo a implementação anterior que causava erro de build ("Unexpected token div").

### Alterações

- **Removido:** Arquivo problemático `src/app/(app)/engineering/page.tsx` (causava erro de build "Unexpected token div")
- **Criado:** Nova página mínima `src/app/(app)/engineering/page.tsx` com componente funcional simples:
  ```tsx
  export default function EngineeringPage() {
    return (
      <main>
        <h1>Engineering Studio</h1>
      </main>
    );
  }
  ```
- **Build:** ✅ Compila com sucesso (Next.js 14, TypeScript strict)
- **Rota:** `/engineering` acessível na aplicação autenticada

### Próximos Passos (Incremental)

Seguindo a estratégia incremental definida no briefing:

1. **Header** → Build
2. **Cards** → Build
3. **Tabela** → Build
4. **Seleção de casos** → Build
5. **Execução de cálculo** → Build
6. **Histórico** → Build

Cada etapa será validada com build antes de prosseguir.

---

## 21/07/2026 — Sprint 4.5: Engineering Validation

**Entregue:** Preparação completa do ambiente para receber as fórmulas oficiais do engenheiro responsável. **NÃO IMPLEMENTA NOVAS FUNCIONALIDADES** — apenas prepara documentação, exemplos e testes.

### Documento de Validação
- **`docs/ENGINEERING_FORMULAS.md`** — 20 cálculos com template padronizado contendo:
  - Nome da fórmula, objetivo, norma de referência, capítulo, equipamentos aplicáveis
  - Variáveis com unidades, restrições, premissas
  - Fórmula matemática, explicação técnica, exemplo resolvido manualmente
  - Caso de teste (input/output JSON), resultado esperado, status (checkbox)
  - Cobre: espessura mínima (6 geometrias), taxa corrosão (2 métodos), vida útil, PMTA (4 geometrias), criticidade, intervalo inspeção, validação pressões, eficiência junta, sobre-espessura corrosão, tensão admissível

### Pasta de Exemplos Reais
- **`docs/examples/`** — exemplos reais da EngeServ para validação:
  - **`V-101_Petrobras_VasoPressao.md`** — Vaso aprovado (Petrobras, TAG V-101)
    - Dados de projeto, medições, histórico, cálculos manuais passo a passo
    - Taxa corrosão 0.133 mm/ano, vida útil 37.6 anos, PMTA 22.38 bar > P_op 20 bar
    - JSON de entrada e saída esperada do sistema
  - **`V-401_Braskem_VasoPressao_REJEITADO.md`** — Vaso rejeitado (Braskem, TAG V-401)
    - Ponto P3 com 4.2 mm vs mínimo 5.5 mm (CRÍTICO)
    - PMTA calculada 4.13 bar < P_op 10 bar (VIOLAÇÃO)
    - JSON de entrada e saída esperada do sistema

### Testes Unitários Vazios
- **`src/modules/engineering/__tests__/`** — 4 arquivos aguardando valores oficiais:
  - `minimum-thickness.test.ts` — 12 casos de teste (válido, inválido, limite, API 650, simulação)
  - `corrosion-rate.test.ts` — 10 casos (2 pontos, regressão, intervalo curto, taxa alta/baixa)
  - `remaining-life.test.ts` — 12 casos (básico, margem, próxima inspeção, taxa zero, críticos)
  - `mawp.test.ts` — 10 casos (válido, inválido, espessura efetiva ≤0, E incomum)

Todos os testes definem a interface esperada. Valores numéricos serão preenchidos após validação do engenheiro.

---

## 29/07/2026 — Incidente de Segurança + Correções RC1

**Vide entrada completa no início deste arquivo (29/07/2026).**

---

## 30/07/2026 — MVP Final: Inspeções, Laudos, Validades, Fotos, Offline

**Entregue:** Implementação completa de todas as prioridades restantes para o MVP funcional.

### Prioridade 1 — Módulo de Inspeções (Finalizado)

**Schema (Prisma):**
- `Client`: adicionado `city` e `state`
- `Equipment`: adicionado `corrosionAllowanceMm`
- `Inspection`: adicionado `type` (INICIAL/PERIODICA/EXTRAORDINARIA), `notes`, `recommendations[]`
- Novo enum `InspectionType`

**Wizard de Inspeção (`/inspecoes/[id]/wizard`):**
- Reescrevido para carregar inspeção via `useParams()` (rota correta)
- Step 1: cliente/equipamento em modo leitura (seleção feita em `/inspecoes/novo`)
- Steps 2-4: navegação Voltar/Próximo com auto-save
- Step 3: medições salvam em lote via API batch
- Step 5: botão **"Gerar Laudo Técnico"** que aciona o Pipeline
- CameraCapture integrado no Step 2 (abre câmera direto, sem galeria)

**APIs criadas:**
- `POST /api/inspections/[id]/measurements/batch` — recebe array de medições, limpa e recria
- `GET/POST /api/reports/pipeline` — orquestra Inspection → Engineering Engine → Pipeline → Report

**Arquivos alterados:**
- `prisma/schema.prisma` — campos additivos
- `src/app/api/inspections/route.ts` — aceita `type`
- `src/app/api/inspections/[id]/route.ts` — aceita `type`, `notes`, `recommendations`
- `src/app/(app)/inspecoes/[id]/wizard/page.tsx` — reescrita completa

### Prioridade 2 — Workspace de Laudos (Finalizado)

**Página de Laudo (`/reports/[id]`):**
- Consome TechnicalReport gerado pelo Pipeline via GET/POST `/api/reports/pipeline`
- Layout profissional EngeServ com:
  - Brand bar (navy) com número do laudo e versão
  - Status + tipo + ART
  - Painel de Cliente (nome, CNPJ, endereço, responsável técnico)
  - Painel de Equipamento (TAG, tipo, fabricante, N/S, ano, norma)
  - Painel de Inspeção (tipo, data, inspetor, engenheiro)
  - Parâmetros de Projeto (18 campos em grid expansível)
  - 10 seções navegáveis via sidebar
- Preparado para exportação futura PDF/Word

**Listagem de Laudos (`/laudos`):**
- Tabela com número do laudo, TAG, cliente, data, status, ações
- Busca por TAG/cliente/número
- Link para visualização que aciona o Pipeline

**Arquivos criados/alterados:**
- `src/app/(app)/reports/[id]/page.tsx` — reescrita completa
- `src/app/(app)/laudos/page.tsx` — reescrita completa
- `src/app/api/reports/pipeline/route.ts` — GET + POST

### Prioridade 3 — Fotos em Nuvem (Finalizado)

**StorageService (`src/modules/storage/`):**
- Interface `StorageService` abstrata com métodos: `upload`, `uploadBuffer`, `delete`, `getSignedUrl`, `healthCheck`
- Provider `VercelBlobStorage` implementado (usa `@vercel/blob`)
- Troca de provedor via `STORAGE_PROVIDER` env var

**CameraCapture (`src/components/CameraCapture.tsx`):**
- Abre câmera diretamente (`facingMode: "environment"`) sem passar pela galeria
- Compressão automática JPEG 80%
- Helper `compressImage()` para compressão programática
- Integrado no Wizard Step 2 por categoria

**Upload API atualizada:**
- `POST /api/inspections/[id]/photos` → usa StorageService quando configurado
- Fallback para placeholder quando sem token

**Arquivos criados:**
- `src/modules/storage/types.ts` — interface StorageService
- `src/modules/storage/providers/vercel-blob.ts` — provider Vercel Blob
- `src/modules/storage/index.ts` — export e factory
- `src/components/CameraCapture.tsx` — captura + compressão

### Prioridade 4 — Validades (Finalizado)

**Página de Validades (`/validades`):**
- Dashboard com KPIs: Total, Vencidos, Próximos (60d), Em dia, Sem data
- Alertas por criticidade: 90/60/30 dias + vencido
- Filtros: busca textual, cliente, status
- Modos: Lista (tabela completa com dias restantes) e Calendário (grid mensal)
- Calendário: navegação entre meses, eventos por dia, cores por status
- Ordenação por vencimento mais próximo

**API:**
- `GET /api/validades` — retorna validades de todos os equipamentos + stats
- Usa `buildValidadeInfo` + `getValidadeStatus` da lib existente

**Arquivos criados/alterados:**
- `src/app/api/validades/route.ts` — criada
- `src/app/(app)/validades/page.tsx` — reescrita completa
- `src/lib/validades.ts` — adicionado `clientId` ao `buildValidadeInfo`

### Prioridade 5 — Offline First (PWA) (Finalizado)

**Service Worker (`public/sw.js`):**
- Cache-first para assets estáticos (Next.js chunks, CSS, JS)
- Network-first para API com fallback ao cache
- Background Sync para fila de upload offline
- Auto-limpeza de caches antigos

**Manifest (`public/manifest.json`):**
- Instalação como aplicativo standalone
- Ícones 192/512, tema navy

**Offline Sync Client (`src/lib/offline.ts`):**
- IndexedDB com stores: `syncQueue`, `inspections`, `equipments`, `clients`
- `initOfflineDetection()` — monitora online/offline
- `addToQueue()` — enfileira requisições para sync posterior
- `processQueue()` — processa fila quando online
- `offlineFetch()` — tenta rede com fallback cache
- `cacheData()` / `getCachedData()` — cache local via IndexedDB

**Registro SW:**
- `src/app/layout.tsx` — registro automático + meta tags PWA

### Build
- ✅ **Build 0 erros** — Next.js 14, TypeScript strict, 35 rotas
- ✅ Todas as páginas compilando: clientes, equipamentos, inspeções, wizard, laudos, reports, validades, dashboard, engineering, configurações, perfis

---

**Build:** ✅ Compila com sucesso (Next.js 14, TypeScript strict)  
**Pronto para:** Validação do engenheiro responsável → Sprint 4 (Implementação das Fórmulas)