# Espessura Mínima Admissível (t_min)

**Base de Conhecimento — EngeServ Inspector**

---

## Objetivo
Calcular a espessura mínima requerida para cada elemento de equipamento (casco, tampos, bocais) conforme código de projeto aplicável.

---

## Aplicação
- Projeto de novos equipamentos
- Validação de espessura em inspeções (t_atual vs t_min)
- Cálculo de PMTA (inverso)
- Classificação criticidade (t_atual vs t_min)

---

## Normas por Tipo de Equipamento

| Equipamento | Norma Principal | Capítulos Relevantes |
|---|---|---|
| **Vaso de Pressão** | ASME VIII-1 | UG-27 (casco), UG-32 (tampos), UG-36 (bocais) |
| **Caldeira** | ASME I | PG-27 (casco), PG-29/30 (tampos) |
| **Tanque Atmosférico** | API 650 | 5.6 (anéis), 5.7 (tampo), 5.8 (fundo) |
| **Tanque Pressurizado** | API 620 | Seções equivalentes |
| **Tubulação** | ASME B31.3 | 304.1 (parede reta), 304.2 (curvas) |
| **Trocador de Calor** | TEMA + ASME VIII-1 | RCB-4 (casco), RCB-5 (tubos) |

---

## Variáveis

| Símbolo | Descrição | Unidade |
|---|---|---|
| t | Espessura mínima requerida (t_min) | mm |
| tₙ | Espessura nominal (com tolerância) | mm |
| P | Pressão interna de projeto | MPa |
| R | Raio interno do elemento | mm |
| D | Diâmetro interno | mm |
| S | Tensão admissível do material à T_projeto | MPa |
| E | Eficiência de junta soldada | adimensional (0-1) |
| Ca | Sobre-espessura de corrosão | mm |
| M | Fator de forma (torisférico) | adimensional |
| L/r | Razão coroa/raio (torisférico) | — |
| P₀ | Pressão externa (vácuo) | MPa |

---

## Unidades
- **Pressão:** MPa (padrão ASME) — 1 MPa = 10 bar
- **Dimensões:** mm
- **Tensão:** MPa
- **Conversão:** P(MPa) = P(bar) / 10

---

## Restrições Gerais (ASME VIII-1 UG-27/32)
1. **P < S×E** (para fórmulas UG-27 cilíndrico)
2. **P < 0.385×S×E** (para tampo elipsoidal UG-32d)
3. **t ≥ Ca** (espessura sempre maior que Ca)
4. **Raio mínimo:** D ≥ 2×t para fórmulas de casco fino
5. **Temperatura ≤ limite material** (ASME II-D)

---

## Premissas
1. Casco fino (R/t > 10) — fórmulas UG-27/32 aplicáveis
2. Pressão interna uniforme
3. Material isotrópico, homogêneo, elástico
4. Sem efeitos de flambagem externos
5. Juntas soldadas com eficiência E conhecida
6. Ca ≥ 0, t_min = t_pressão + Ca

---

## Fórmulas ASME VIII-1

### 1. Casco Cilíndrico (UG-27(c)(1)) — Pressão Interna
```
t = (P × R) / (S × E - 0.6 × P) + Ca
```
**Válido para:** P ≤ 0.385 × S × E

**Variáveis:**
- P: pressão de projeto (MPa)
- R: raio interno = D_int / 2 (mm)
- S: tensão admissível (MPa)
- E: eficiência junta
- Ca: sobre-espessura corrosão

---

### 2. Casco Esférico (UG-27(c)(2)) — Pressão Interna
```
t = (P × R) / (2 × S × E - 0.2 × P) + Ca
```
**Válido para:** P ≤ 0.665 × S × E

---

### 3. Tampo Elipsoidal 2:1 (UG-32(d)) — Pressão Interna
```
t = (P × D) / (2 × S × E - 0.2 × P) + Ca
```
**Válido para:** Proporção 2:1 (h = D/4), P ≤ 0.385 × S × E

**Nota:** D = diâmetro interno do casco (mm)

---

### 4. Tampo Torisférico (UG-32(e)) — Pressão Interna
```
t = (P × D × M) / (2 × S × E - 0.2 × P) + Ca
```

**Onde M = Fator de Forma:**
```
M = 1 / (4 × (1 + √(1 - (L/r)²)))   [aprox.]
```
Ou usar tabela UG-32(e) com L/r conhecido.

**Valores típicos M:**
- L/r = 1.0 (semiesférico): M = 1.0
- L/r = 0.9: M = 1.05
- L/r = 0.8: M = 1.15
- L/r = 0.7: M = 1.30
- L/r = 0.6: M = 1.55

**Válido para:** L/r ≥ 0.6, P ≤ 0.385 × S × E

---

### 5. Tampo Hemisférico (UG-32(c)) — Pressão Interna
```
t = (P × R) / (2 × S × E - 0.2 × P) + Ca
```
**Igual ao casco esférico** (tampo hemisférico = meio esfera)

---

### 6. Tampo Cônico (UG-32(g)) — Pressão Interna
```
t = (P × D) / (2 × S × E × cos(α) - 0.6 × P) + Ca
```
**Onde α = semi-ângulo do cone (graus)**
- α típico: 30° a 60°
- cos(α) reduz tensão admissível efetiva

---

## Fórmulas ASME I (Caldeiras)

### Casco Cilíndrico (PG-27)
```
t = (P × D) / (2 × S × E + 2 × P × y) + Ca
```
**Onde y = coeficiente (0.4 para T ≤ 480°C, 0.7 para T > 480°C)**

---

## Fórmulas API 650 (Tanques Atmosféricos)

### Anéis de Parede (5.6.1)
```
t = (P × D) / (2 × S × E) + Ca
```
**Onde P = pressão hidrostática na base do anel (MPa)**
- P = ρ × g × h (ρ = densidade fluido kg/m³, h = altura até base do anel)
- Para água: P ≈ 0.00981 × h (m) MPa

### Tampo (5.7)
- **Cônico:** t = (P × D) / (2 × S × E × cos(α))
- **Semielíptico:** Igual ASME VIII-1 UG-32(d)

### Fundo (5.8)
```
t = (P × D) / (2 × S × E) + Ca
```

---

## Tolerância de Fabricação (ASME VIII-1 UG-16)

| Tipo | Tolerância |
|---|---|
| **Placas (chapas)** | -0.25 mm / +0.25 mm (ou % conforme spec) |
| **Tubos** | Conforme spec ASTM/ASME |
| **Tampões forjados** | Conforme spec |

**Espessura Nominal (tₙ):**
```
tₙ = t_min + Tolerância_Negativa_Absoluta
```
Ex: Se tolerância = -0.25mm, tₙ = t_min + 0.25mm

---

## Regra EngeServ: "Camisa > 2,5 mm"

> **"A camisa do cilindro deve manter coeficiente de segurança compatível com espessura mínima acima de 2,5 mm, desconsiderando corrosão adicional."**

**Interpretação:**
- t_min_calculada - Ca > 2.5 mm
- Ou seja: a espessura de pressão pura deve deixar margem > 2.5mm após deduzir Ca
- **CONFIRMAR COM ENGENHEIRO:** Fixa para todos ou varia por tipo/norma?

---

## Classificação de Criticidade (Regra EngeServ)

| Status | Critério | Ação |
|---|---|---|
| **OK** | t_atual > 1.2 × t_min | Normal |
| **ATENÇÃO** | t_min < t_atual ≤ 1.2 × t_min | Reduzir intervalo, monitorar |
| **CRÍTICO** | t_atual ≤ t_min | **Parada imediata** |
| **REGRA 2.5mm** | t_atual - Ca ≤ 2.5 mm | **Parada imediata** |

---

## Exemplos

### Exemplo 1: Vaso Cilíndrico ASME VIII-1
**Dados:** P=2.5 MPa, D=1000mm, SA-516 Gr.70 (S=138 MPa a 100°C), E=1.0, Ca=3.0mm

**Cálculo:**
- R = 500 mm
- t = (2.5 × 500) / (138 × 1.0 - 0.6 × 2.5) + 3.0
- t = 1250 / (138 - 1.5) + 3.0 = 1250 / 136.5 + 3.0 = 9.16 + 3.0 = **12.16 mm**
- tₙ = 12.16 + 0.25 = **12.41 mm** (usar placa 13mm comercial)

---

### Exemplo 2: Tampo Elipsoidal Mesmo Vaso
**Dados:** P=2.5 MPa, D=1000mm, S=138, E=1.0, Ca=3.0

**Cálculo:**
- t = (2.5 × 1000) / (2 × 138 × 1.0 - 0.2 × 2.5) + 3.0
- t = 2500 / (276 - 0.5) + 3.0 = 2500 / 275.5 + 3.0 = 9.07 + 3.0 = **12.07 mm**

---

### Exemplo 3: Tampo Torisférico (L/r=0.8)
**Dados:** P=2.5 MPa, D=1000mm, S=138, E=1.0, Ca=3.0, M=1.15

**Cálculo:**
- M = 1.15 (para L/r=0.8)
- t = (2.5 × 1000 × 1.15) / (2 × 138 × 1.0 - 0.2 × 2.5) + 3.0
- t = 2875 / 275.5 + 3.0 = 10.43 + 3.0 = **13.43 mm**

---

### Exemplo 4: Tanque Atmosférico API 650
**Dados:** D=20000mm, h=15m (água), SA-36 (S=115 MPa a 50°C), E=0.85, Ca=1.5mm

**Cálculo anel inferior (h=15m):**
- P = 0.00981 × 15 = 0.147 MPa
- t = (0.147 × 20000) / (2 × 115 × 0.85) + 1.5
- t = 2940 / 195.5 + 1.5 = 15.04 + 1.5 = **16.54 mm**

---

## Dados para Testes Unitários

| Caso | Input | Expected t_min |
|---|---|---|
| Cilíndrico ASME | P=2.5, R=500, S=138, E=1.0, Ca=3.0 | 12.16 |
| Elipsoidal | P=2.5, D=1000, S=138, E=1.0, Ca=3.0 | 12.07 |
| Torisférico M=1.15 | P=2.5, D=1000, S=138, E=1.0, Ca=3.0, M=1.15 | 13.43 |
| Esférico | P=2.5, R=500, S=138, E=1.0, Ca=3.0 | 7.58 |
| Cônico α=30° | P=2.5, D=1000, S=138, E=1.0, Ca=3.0 | 13.99 |
| API 650 anel | P=0.147, D=20000, S=115, E=0.85, Ca=1.5 | 16.54 |

---

## Status de Implementação

| Funcionalidade | Status | Arquivo |
|---|---|---|
| Cilíndrico UG-27 | [x] Placeholder | `minimum-thickness.ts` |
| Elipsoidal UG-32(d) | [x] Placeholder | `minimum-thickness.ts` |
| Torisférico UG-32(e) | [x] Placeholder | `minimum-thickness.ts` |
| Hemisférico UG-32(c) | [x] Placeholder | `minimum-thickness.ts` |
| Cônico UG-32(g) | [x] Placeholder | `minimum-thickness.ts` |
| Esférico UG-27(c)(2) | [x] Placeholder | `minimum-thickness.ts` |
| API 650 | [x] Placeholder | `minimum-thickness.ts` |
| Classificação criticidade | [x] Domain | `domain/entities.ts` |
| Regra 2.5mm | [x] Domain | `domain/entities.ts` |

---

## Referências
1. ASME BPVC VIII-1 (2021) — UG-27, UG-32, UG-16
2. ASME BPVC I (2021) — PG-27, PG-29
3. API 650 (2020) — Seções 5.6, 5.7, 5.8
4. ASME B31.3 (2020) — 304.1, 304.2
5. NR-13 (2023) — 13.5

---

**Última atualização:** 21/07/2026  
**Responsável:** Engenheiro Responsável EngeServ  
**Próxima revisão:** Após validação Sprint 5