# Corrosão — Taxa, Classificação e Gestão

**Base de Conhecimento — EngeServ Inspector**

---

## Objetivo
Documentar métodos de cálculo, classificação e gestão de corrosão em equipamentos NR-13, baseados em API 570, API 510, ASME VIII-1 e práticas EngeServ.

---

## Aplicação
- Cálculo de taxa de corrosão (mm/ano)
- Classificação de severidade
- Determinação de intervalo de inspeção
- Cálculo de vida útil remanescente
- Sobre-espessura de corrosão (Ca) por material/fluido

---

## Normas
| Norma | Seção | Uso |
|---|---|---|
| **API 570** | 7.2, 7.3, 7.4 | Tubulação: taxa, intervalos, vida útil |
| **API 510** | 6.2, 6.3, 6.4 | Vasos: taxa, intervalos, vida útil |
| **ASME VIII-1** | UG-25 | Sobre-espessura de corrosão |
| **NR-13** | 13.5, 13.7 | Requisitos legais |
| **API 581** | — | RBI (referência para criticidade) |

---

## Variáveis

| Símbolo | Descrição | Unidade |
|---|---|---|
| CR | Taxa de corrosão (Corrosion Rate) | mm/ano |
| tₚ | Espessura anterior (previous thickness) | mm |
| tₐ | Espessura atual (actual thickness) | mm |
| Δt | Intervalo entre inspeções | anos |
| Ca | Sobre-espessura de corrosão (Corrosion Allowance) | mm |
| tₘᵢₙ | Espessura mínima admissível | mm |
| Vida | Vida útil remanescente | anos |

---

## Unidades
- **Taxa de corrosão:** mm/ano (padrão) — 1 mm/ano = 39.37 mpy (mils per year)
- **Espessura:** mm
- **Tempo:** anos (decimais para meses: 0.5 = 6 meses)

---

## Fórmulas

### 1. Taxa de Corrosão — Duas Inspeções (API 570 7.2 / API 510 6.2)

```
CR = (tₚ - tₐ) / Δt
```

**Onde:**
- tₚ = espessura da inspeção anterior (mm)
- tₐ = espessura da inspeção atual (mm) — **usar o menor valor medido no ponto correspondente**
- Δt = intervalo em anos entre as duas inspeções

**Restrições:**
- Δt ≥ 0.5 anos (recomendado ≥ 1 ano para confiabilidade)
- tₚ > tₐ (se tₐ ≥ tₚ → investigar erro de medição ou ponto diferente)
- Mesmo ponto de medição (mesmo Ponto ID, mesma orientação)

---

### 2. Taxa de Corrosão — Regressão Linear (3+ Inspeções) (API 570 7.3)

```
t = a + b × tempo
CR = -b  (inclinação negativa = perda de espessura)
```

**Método:** Regressão linear dos mínimos quadrados
- **Dados:** (tempoᵢ, espessura_mínimaᵢ) para cada inspeção histórica
- **Saída:** CR (mm/ano), R² (coeficiente de determinação), intervalo de confiança

**Vantagem:** Mais robusto, detecta aceleração/desaceleração da corrosão

**Critério API:** R² ≥ 0.8 para alta confiança

---

### 3. Vida Útil Remanescente (API 570 7.4 / API 510 6.4)

```
Vida = (tₐ - tₘᵢₙ - Margem_Segurança) / CR
```

**Onde:**
- tₐ = espessura atual mínima (mm)
- tₘᵢₙ = espessura mínima admissível de projeto (mm)
- Margem_Segurança = 1.0 mm (padrão EngeServ) ou valor por norma
- CR = taxa de corrosão (mm/ano) — **deve ser > 0**

**Se CR = 0:** Vida = Indeterminada (monitorar, não calcular)

---

### 4. Próxima Inspeção (Intervalo Ajustado)

```
I_ajustado = min( I_padrão × Fator_Condição , Vida/2 × 12 )
```

**Fator_Condição:**
| Condição | Fator |
|---|---|
| CR ≤ 0.1 mm/a | 1.0 |
| 0.1 < CR ≤ 0.5 | 0.75 |
| 0.5 < CR ≤ 1.0 | 0.5 |
| CR > 1.0 | 0.25 |
| tₐ ≤ 1.2 × tₘᵢₙ | 0.5 |
| tₐ ≤ tₘᵢₙ | 0 (Imediata) |
| Reparo/Alteração/Incidente recentes | 0.5 |

**Regras:**
- Mínimo absoluto: 6 meses (caldeira: 12 meses)
- Máximo: I_padrão da norma
- Arredondar para mês inteiro (teto)

---

### 5. Sobre-espessura de Corrosão (Ca) — ASME VIII-1 UG-25

**Definição:** Espessura adicional adicionada à t_min para compensar perda por corrosão durante vida útil.

**Valores Padrão EngeServ (mm):**

| Material / Fluido | Ca (mm) |
|---|---|
| Aço Carbono + Hidrocarbonetos/Água | 3.0 |
| Aço Carbono + Ar Comprimido/Vapor | 1.5-2.0 |
| Aço Inox 304/316 + Água/Processo | 1.0-1.5 |
| Aço Inox Duplex + Água Salgada | 0.5-1.0 |
| Ligas Ni (Monel, Inconel, Hastelloy) | 0.5-1.0 |
| Tanques Atmosféricos (API 650) | 1.5-3.0 (conforme produto) |

**Regra:** Ca ≥ 0. Se equipamento sem corrosão esperada, Ca = 0.

---

## Classificação de Criticidade por Espessura (Regra EngeServ)

| Status | Critério | Ação |
|---|---|---|
| **OK** | tₐ > 1.2 × tₘᵢₙ | Inspeção normal |
| **ATENÇÃO** | tₘᵢₙ < tₐ ≤ 1.2 × tₘᵢₙ | Reduzir intervalo 50%, monitorar |
| **CRÍTICO** | tₐ ≤ tₘᵢₙ | **Parada imediata**, reparo ou substituição |
| **REGRA 2,5mm** | tₐ ≤ 2.5 mm | **Parada imediata** (regra de negócio EngeServ) |

> **Nota:** A regra dos 2.5 mm é independente do tₘᵢₙ calculado. Confirmação do engenheiro se fixa ou varia por tipo/norma.

---

## Fluxo de Cálculo Automatizado

```
ENTRADA: Inspeção atual + Histórico
    │
    ▼
1. Validar medições (mesmo ponto, mesma orientação)
    │
    ▼
2. Se 2 inspeções → CR = (tₚ - tₐ) / Δt
   Se 3+ inspeções → Regressão linear (CR = -slope)
    │
    ▼
3. Classificar CR:
   BAIXA (≤0.1) | MÉDIA (0.1-0.5) | ALTA (0.5-1.0) | CRÍTICA (>1.0)
    │
    ▼
4. Calcular Vida = (tₐ - tₘᵢₙ - 1.0) / CR
    │
    ▼
5. Calcular Próxima Inspeção = min(Padrão × Fator, Vida/2)
    │
    ▼
6. Determinar Status: OK / ATENÇÃO / CRÍTICO
    │
    ▼
SAÍDA: CR, Vida, Próxima_Inspeção, Status, Recomendações
```

---

## Exemplos

### Exemplo 1: Duas Inspeções
**Vaso V-101 Petrobras**
- 2021: tₘᵢₙ = 11.9 mm
- 2024: tₘᵢₙ = 11.5 mm
- Δt = 3.0 anos

**CR = (11.9 - 11.5) / 3.0 = 0.133 mm/ano** → **MÉDIA**

---

### Exemplo 2: Três Inspeções (Regressão)
**Tanque T-301 Vale**
- 2018: 5.8 mm
- 2021: 5.6 mm
- 2024: 5.3 mm

**Regressão:** slope = -0.167 → **CR = 0.167 mm/ano** (R² = 1.0)

---

### Exemplo 3: Vida Útil
**Vaso V-401 Braskem (REJEITADO)**
- tₐ = 4.2 mm | tₘᵢₙ = 5.5 mm | CR = 0.3 mm/a
- tₐ < tₘᵢₙ → **Vida = 0** → **CONDENADO**

---

### Exemplo 4: Próxima Inspeção
- I_padrão = 60 meses (5 anos, vaso risco médio)
- CR = 0.3 mm/a → Fator = 0.5
- Vida = 8 anos → Vida/2 = 48 meses
- I_ajustado = min(60×0.5, 48) = **30 meses**

---

## Dados para Validação (Testes Unitários)

| Caso | Input | Expected Output |
|---|---|---|
| Básico 2 pts | tₚ=12.0, tₐ=11.5, Δt=2.5 | CR=0.2 |
| Regressão 3 pts | (0,12.0), (2,11.6), (4,11.2) | CR=0.2, R²=1.0 |
| Vida útil | tₐ=10.0, tₘᵢₙ=5.5, CR=0.15 | Vida=23.3 anos |
| Próxima inspeção | Padrão=60m, Fator=0.75, Vida=20a | min(45, 120)=45m |
| CR=0 | tₐ=12.0, tₚ=12.0, Δt=5 | CR=0, Vida=INF |

---

## Status de Implementação

| Funcionalidade | Status | Arquivo |
|---|---|---|
| CR 2 pontos | [x] Placeholder | `calculations/corrosion-rate.ts` |
| Regressão linear | [x] Placeholder | `calculations/corrosion-rate.ts` |
| Vida útil | [x] Placeholder | `calculations/remaining-life.ts` |
| Próxima inspeção | [ ] Pendente | `domain/entities.ts` |
| Classificação OK/ATENÇÃO/CRÍTICO | [x] Domain | `domain/entities.ts` |
| Regra 2.5mm | [x] Domain | `domain/entities.ts` |
| Ca por material/fluido | [x] Constants | `constants/index.ts` |

---

## Referências
1. API 570 (2016) — Piping Inspection Code, Sections 7.2-7.4
2. API 510 (2020) — Pressure Vessel Inspection, Sections 6.2-6.4
3. ASME BPVC VIII-1 (2021) — UG-25 Corrosion Allowance
4. API 581 (2016) — Risk-Based Inspection (RBI)
5. NR-13 (2023) — Itens 13.5, 13.7.2

---

**Última atualização:** 21/07/2026  
**Responsável:** Engenheiro Responsável EngeServ  
**Próxima revisão:** Após validação Sprint 5