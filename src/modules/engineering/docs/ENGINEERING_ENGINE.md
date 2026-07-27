# ENGINEERING_ENGINE.md

**Documentação da Arquitetura do Motor de Engenharia - EngeServ Inspector**

---

## 1. VISÃO GERAL

O **Engineering Engine** (Motor de Engenharia) é o módulo responsável por concentrar **TODOS** os cálculos técnicos do sistema. Ele é completamente isolado da interface, do banco de dados e da lógica de negócio geral.

### Princípios Fundamentais

| Princípio | Descrição |
|-----------|-----------|
| **Isolamento Total** | Nenhuma fórmula NR-13/ASME/API vive fora deste módulo |
| **Validação Obrigatória** | Todo cálculo valida entradas antes de executar |
| **Resultado Estruturado** | Sempre retorna objeto com valor, unidade, status, criticidade, explicação, referência, confiabilidade, observações |
| **Rastreabilidade** | Log completo de quem calculou, quando, com quais entradas, qual versão da fórmula/norma |
| **Extensibilidade** | Novos cálculos adicionados sem quebrar existentes |
| **Sem Fórmulas Definitivas** | Placeholders aguardam validação do engenheiro responsável |

---

## 2. ARQUITETURA

### Estrutura de Pastas

```
src/modules/engineering/
├── domain/                 # Regras de negócio puras (entidades, value objects, eventos)
│   ├── entities.ts         # Equipment, Inspection, Measurement, Material
│   ├── value-objects.ts    # Thickness, Pressure, Temperature, CorrosionRate
│   └── events.ts           # Domain events (EquipmentCreated, InspectionApproved...)
├── application/            # Casos de uso (Use Cases)
│   └── use-cases.ts        # AnalyzeIntegrity, CalculateMinimumThickness...
├── calculations/           # Implementações dos cálculos (Calculators)
│   ├── minimum-thickness.ts
│   ├── corrosion-rate.ts
│   ├── remaining-life.ts
│   ├── mawp.ts
│   └── index.ts            # Exporta todos os calculators
├── validators/             # Validação de entradas
│   └── index.ts            # validateEquipment, validateInspection, validateMeasurements...
├── types/                  # TypeScript interfaces
│   └── index.ts            # EquipmentData, InspectionData, CalculationInput, CalculationResult...
├── constants/              # Constantes, thresholds, materiais de referência
│   └── index.ts            # THICKNESS_THRESHOLDS, MATERIAL_REFERENCES, FLUID_CLASSES...
├── utils/                  # Utilitários puros
│   └── units.ts            # CONVERSÕES CENTRALIZADAS (único lugar para conversão de unidades)
├── services/               # Serviços de aplicação
│   └── engine.ts           # EngineeringEngineService (orquestra cálculos)
├── hooks/                  # React hooks (futuro)
├── components/             # Componentes UI específicos (futuro)
└── docs/                   # Documentação técnica
    └── formulas.md         # Referência das fórmulas por norma
```

### Diagrama de Dependências

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  (Use Cases: AnalyzeIntegrity, CalculateX, Simulate, etc.)  │
└──────────────────────────┬──────────────────────────────────┘
                           │ usa
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│  (Entities, Value Objects, Domain Events, Engine Service)   │
└──────────────────────────┬──────────────────────────────────┘
                           │ orquestra
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CALCULATIONS LAYER                         │
│  (Calculators: MinimumThickness, CorrosionRate,            │
│   RemainingLife, MAWP, + futuros)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ usa
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  VALIDATORS │ │  CONSTANTS  │ │    UNITS    │
    │  (entries)  │ │ (thresholds)│ │ (conversions)│
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 3. MODELAGEM DE DADOS (TIPOS)

### Principais Interfaces (`src/modules/engineering/types/index.ts`)

```typescript
// Entrada unificada para todos os cálculos
interface CalculationInput {
  equipment: EquipmentData;           // Dados do equipamento (do banco)
  inspection: InspectionData;         // Dados da inspeção (do banco)
  measurements: MeasurementPoint[];   // Medições de ultrassom (do banco)
  material?: MaterialData;            // Opcional: dados do material
  operatingConditions?: OperatingConditions;
  
  // Parâmetros opcionais para cálculos específicos
  corrosionRateMmPerYear?: number;
  previousInspectionDate?: Date;
  previousMinThicknessMm?: number;
  jointEfficiency?: number;
  corrosionAllowanceMm?: number;
  safetyFactor?: number;
}

// Resultado PADRÃO de TODO cálculo
interface CalculationResult<T = any> {
  value: T;                           // Valor calculado
  unit: string;                       // Unidade (mm, bar, MPa, anos, %)
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INSUFFICIENT_DATA' | 'NOT_APPLICABLE';
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NOT_ASSESSED';
  explanation: string;                // Explicação textual
  normativeReference: string;         // Ex: "ASME VIII-1 UG-27 / NR-13 Item 13.5.2"
  reliability: 'HIGH' | 'MEDIUM' | 'LOW' | 'THEORETICAL';
  observations: string[];             // Observações/avisos
  metadata: CalculationMetadata;      // Rastreabilidade
}
```

### Objetos de Valor (`domain/value-objects.ts`)

- `Thickness` - Espessura com unidade e conversões
- `Pressure` - Pressão com validação e conversões
- `Temperature` - Temperatura com conversões
- `CorrosionRate` - Taxa de corrosão com classificação (alta/média/baixa/zero)

---

## 4. CÁLCULOS IMPLEMENTADOS (PLACEHOLDERS)

| Calculator | Arquivo | Fórmulas de Referência | Status |
|------------|---------|------------------------|--------|
| **MinimumThickness** | `calculations/minimum-thickness.ts` | ASME VIII-1 UG-27, API 650 | ⚠️ Placeholder |
| **CorrosionRate** | `calculations/corrosion-rate.ts` | API 570/510 (t_anterior - t_atual) / Δt | ⚠️ Placeholder |
| **RemainingLife** | `calculations/remaining-life.ts` | (t_atual - t_mínima) / taxa_corrosão | ⚠️ Placeholder |
| **MAWP** | `calculations/mawp.ts` | ASME VIII-1 inverso: P = (S*E*t)/(R+0.6t) | ⚠️ Placeholder |

> **⚠️ IMPORTANTE**: Todos os cálculos retornam `status: 'WARNING'` e `reliability: 'THEORETICAL'` porque são **placeholders**. A implementação real **DEVE** ser validada pelo engenheiro responsável antes de ir para produção.

### Próximos Cálculos (Backlog)
- Eficiência de juntas (E)
- Sobre-espessura de corrosão (Ca)
- Classificação de criticidade automática
- Pressão de projeto vs operação
- Cálculo de tampas (elipsoidal, torisférico, hemisférico)
- Flambagem / estabilidade
- Fadiga / ciclos de pressão
- Tubulações (ASME B31.3)

---

## 5. VALIDAÇÃO DE ENTRADAS

O módulo `validators/` centraliza todas as validações:

```typescript
// Validações disponíveis
validateEquipmentData(equipment)        // Equipamento completo
validateInspectionData(inspection)      // Inspeção completa
validateMeasurementPoint(point)         // Ponto individual
validateMeasurements(measurements[])    // Array de medições
validateCalculationInput(input)         // Input completo para engine
validateUnitConsistency(input)          // Detecta unidades erradas (MPa vs bar, cm vs mm, in vs mm)
```

### Regras de Validação

| Campo | Regras |
|-------|--------|
| Espessura (mm) | > 0.1, < 500, t_mínima < t_original |
| Pressão (bar) | >= 0, < 1000, P_operacao <= P_projeto |
| Temperatura (°C) | -100 a 600 |
| Eficiência junta (E) | 0 < E <= 1 (valores padrão: 1.0, 0.85, 0.7) |
| Ca (sobre-espessura) | >= 0, < 50mm |
| Taxa corrosão | >= 0, warning se > 10 mm/ano (possível confusão µm/ano) |

---

## 6. SISTEMA DE UNIDADES (CENTRALIZADO)

**Arquivo**: `utils/units.ts`

**Regra de Ouro**: **NUNCA** fazer conversão de unidade fora deste módulo.

```typescript
// Uso correto
import { toBar, fromBar, toMm, fromMm, toCelsius } from '@/modules/engineering/utils/units';

const pressureBar = toBar(10, 'MPa');      // 10 MPa → 100 bar
const thicknessMm = toMm(1.5, 'cm');       // 1.5 cm → 15 mm
const tempC = toCelsius(212, 'F');         // 212°F → 100°C

// Formatação para exibição
formatPressure(100, 'bar', 2);    // "100.00 bar"
formatLength(15.5, 'mm', 2);      // "15.50 mm"
```

### Unidades Suportadas

| Grandeza | Unidade Padrão | Conversões Disponíveis |
|----------|----------------|------------------------|
| Pressão | bar | MPa, psi, kgf/cm², kPa |
| Espessura | mm | cm, m, in, ft |
| Temperatura | °C | °F, K |
| Volume | L | m³, gal, ft³ |
| Tensão | MPa | psi, kgf/cm², kPa |

---

## 7. SERVIÇO PRINCIPAL: `EngineeringEngineService`

**Arquivo**: `services/engine.ts`

### Métodos Principais

```typescript
class EngineeringEngineService {
  // Análise completa de integridade (orquestra todos os cálculos)
  async analyzeIntegrity(input: CalculationInput): Promise<IntegrityAnalysis>
  
  // Simulação de cenários futuros
  async simulate(input: SimulationInput): Promise<SimulationResult>
  
  // Log de auditoria
  getCalculationLog(): CalculationLogEntry[]
  clearLog(): void
}
```

### O que `analyzeIntegrity` Executa

1. **Valida entrada** completa
2. **Verifica consistência de unidades** (MPa vs bar, cm vs mm, etc.)
3. **Encontra menor espessura medida**
4. **Obtém tensão admissível** do material (interpolação por temperatura)
5. **Estima diâmetro interno** (se não informado, usa volume)
6. **Executa cálculos em sequência**:
   - Espessura mínima admissível (t_min)
   - Taxa de corrosão (se há inspeção anterior)
   - Vida útil remanescente
   - PMTA (pressão máxima admissível atual)
7. **Determina status geral**: INTEGRO / ACEITÁVEL_COM_RESTRIÇÕES / REQUER_REPARO / CONDENADO / INDETERMINADO
8. **Gera recomendações** e fatores de risco
9. **Registra log de auditoria** completo

---

## 8. CASOS DE USO (APPLICATION LAYER)

**Arquivo**: `application/use-cases.ts`

| Use Case | Descrição |
|----------|-----------|
| `AnalyzeEquipmentIntegrityUseCase` | Análise completa de integridade |
| `CalculateMinimumThicknessUseCase` | Cálculo isolado t_min |
| `CalculateCorrosionRateUseCase` | Taxa de corrosão entre inspeções |
| `CalculateRemainingLifeUseCase` | Vida útil remanescente |
| `CalculateMawpUseCase` | PMTA baseada na espessura atual |
| `SimulateScenarioUseCase` | Projeção de cenários |
| `ValidateEquipmentForCalculationUseCase` | Valida equipamento |
| `ValidateInspectionForCalculationUseCase` | Valida inspeção |
| `ValidateMeasurementsForCalculationUseCase` | Valida medições |

### Factory (Dependency Injection)

```typescript
import { EngineeringUseCaseFactory } from '@/modules/engineering/application/use-cases';

const analyzeUseCase = EngineeringUseCaseFactory.createAnalyzeIntegrityUseCase();
const result = await analyzeUseCase.execute(calculationInput);
```

---

## 9. LOGS DE AUDITORIA

Todo cálculo registra:

```typescript
interface CalculationLogEntry {
  calculationId: string;        // Ex: "integrity-1703123456789"
  calculatedAt: Date;           // Timestamp
  calculatedBy: string;         // User ID
  formulaVersion: string;       // Versão da fórmula
  normativeVersion: string;     // Ex: "ASME 2021 / NR-13 2023"
  inputs: Record<string, any>;  // Entradas sanitizadas
  results: Record<string, any>; // Resultados sanitizados
}
```

---

## 10. COMO ADICIONAR NOVO CÁLCULO

### Passo a Passo

1. **Criar tipos** em `types/index.ts`:
   ```typescript
   interface NovoCalculoInput { ... }
   interface NovoCalculoResult { ... }
   ```

2. **Criar calculator** em `calculations/novo-calculo.ts`:
   ```typescript
   export class NovoCalculator implements ICalculator<NovoCalculoInput, NovoCalculoResult> {
     validate(input) { ... }
     calculate(input) { ... }
   }
   ```

3. **Exportar** em `calculations/index.ts`:
   ```typescript
   export { NovoCalculator } from './novo-calculo';
   export const calculators = { ..., novo: new NovoCalculator() };
   ```

4. **Adicionar validações** em `validators/index.ts` se necessário

5. **Adicionar constantes/thresholds** em `constants/index.ts`

6. **Documentar fórmula** em `docs/formulas.md`

7. **Adicionar ao serviço** `services/engine.ts` se fizer parte da análise completa

8. **Criar Use Case** em `application/use-cases.ts`

---

## 11. EXEMPLO DE USO NA API

```typescript
// Em uma API Route Handler (ex: /api/engineering/analyze)
import { EngineeringUseCaseFactory } from '@/modules/engineering/application/use-cases';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Buscar dados do banco (equipamento, inspeção, medições)
  const input = await buildCalculationInput(body.equipmentId, body.inspectionId);
  
  // Executar caso de uso
  const useCase = EngineeringUseCaseFactory.createAnalyzeIntegrityUseCase();
  const analysis = await useCase.execute(input);
  
  // Salvar resultado no banco (opcional)
  await saveAnalysisResult(analysis);
  
  return NextResponse.json({ analysis });
}
```

---

## 12. PONTOS PREPARADOS PARA FÓRMULAS OFICIAIS

| Cálculo | Onde Implementar | Referência Normativa |
|---------|------------------|---------------------|
| t_min casco cilíndrico | `MinimumThicknessCalculator.calculate()` | ASME VIII-1 UG-27 |
| t_min casco esférico | `MinimumThicknessCalculator.calculate()` | ASME VIII-1 UG-27 |
| t_min tampo elipsoidal | `MinimumThicknessCalculator.calculate()` | ASME VIII-1 UG-32 |
| t_min tampo torisférico | `MinimumThicknessCalculator.calculate()` | ASME VIII-1 UG-32 |
| Taxa corrosão (2 pontos) | `CorrosionRateCalculator.calculate()` | API 570 7.2 |
| Taxa corrosão (regressão) | `CorrosionRateCalculator.calculate()` | API 570 7.3 |
| Vida remanescente | `RemainingLifeCalculator.calculate()` | API 570 7.4 |
| PMTA (MAWP) | `MawpCalculator.calculate()` | ASME VIII-1 UG-27 invertido |
| Classificação criticidade | Novo `CriticalityCalculator` | NR-13 13.5 + API 581 |
| Próxima inspeção | `RemainingLifeCalculator` + normas | NR-13 13.7 / API 510/570 |

---

## 13. CONFIGURAÇÕES IMPORTANTES (`constants/index.ts`)

```typescript
THICKNESS_THRESHOLDS = {
  ABSOLUTE_MIN_THICKNESS_MM: 2.5,        // Regra de negócio: > 2.5mm
  CRITICAL_THRESHOLD_PERCENT: 100,       // <= 100% do mínimo = CRÍTICO
  WARNING_THRESHOLD_PERCENT: 120,        // <= 120% do mínimo = ATENÇÃO
  DEFAULT_SAFETY_FACTOR: 1.5,
  DEFAULT_CORROSION_ALLOWANCE_MM: { ... }, // Por tipo de equipamento
  DEFAULT_JOINT_EFFICIENCY: 1.0,
  DEFAULT_INSPECTION_INTERVALS_MONTHS: { ... }, // Por tipo
}
```

---

## 14. MATERIAIS DE REFERÊNCIA (`constants/index.ts`)

```typescript
MATERIAL_REFERENCES = {
  'SA-516_GR70': { Sy: 260, Su: 485, S_by_temp: { 50: 138, 100: 138, ... } },
  'SA-516_GR60': { Sy: 220, Su: 415, S_by_temp: { ... } },
  'SA-36': { Sy: 250, Su: 400, S_by_temp: { ... } },
  'SA-240_316L': { Sy: 170, Su: 485, S_by_temp: { ... } },
  'SA-240_304L': { ... },
  'A-36': { ... },
}
```

---

## 15. CHECKLIST PARA VALIDAÇÃO DO ENGENHEIRO

Antes de colocar em produção, o engenheiro deve validar:

- [ ] **Fórmulas**: Cada fórmula em `calculations/*.ts` conferida contra norma original
- [ ] **Constantes**: Thresholds em `constants/index.ts` aprovados
- [ ] **Materiais**: Tensões admissíveis por temperatura em `MATERIAL_REFERENCES` conferidas
- [ ] **Unidades**: Todas as conversões em `utils/units.ts` testadas
- [ ] **Validações**: Regras em `validators/index.ts` completas
- [ ] **Logs**: Estrutura de auditoria atende requisitos regulatórios
- [ ] **Testes**: Casos de teste com valores conhecidos (hand calculations)
- [ ] **Edge cases**: Equipamentos sem medições, sem inspeção anterior, materiais não catalogados

---

## 16. VERSIONAMENTO

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2025 | Estrutura base, placeholders para 4 cálculos principais, validações, unidades, logs |

---

**Última atualização**: Sprint 4 - Engineering Engine Infrastructure
**Próxima revisão**: Após validação das fórmulas pelo engenheiro responsável