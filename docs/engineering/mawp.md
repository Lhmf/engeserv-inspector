# PMTA — Pressão Máxima de Trabalho Admissível (MAWP)

**Base de Conhecimento — EngeServ Inspector**

---

## Objetivo
Calcular a Pressão Máxima de Trabalho Admissível (MAWP/PMTA) baseada na **espessura atual** do equipamento, para validar se o equipamento pode operar com segurança na pressão de operação atual.

---

## Aplicação
- Validação de integridade em inspeções periódicas
- Cálculo de pressão máxima permitida após corrosão
- Decisão de redução de pressão / parada / reparo
- Documentação no laudo de inspeção NR-13

---

## Normas
| Norma | Seção | Uso |
|---|---|---|
| **ASME VIII-1** | UG-27 (inverso), UG-32 (inverso) | Vasos de pressão |
| **ASME I** | PG-27 (inverso) | Caldeiras |
| **API 570 / 510** | 7.4 / 6.4 | Inspeção: MAWP baseado em espessura medida |
| **API 650** | 5.6 (inverso) | Tanques atmosféricos |
| **NR-13** | 13.5.2 | Pressão admissível de trabalho |

---

## Variáveis

| Símbolo | Descrição | Unidade |
|---|---|---|
| P | PMTA / MAWP calculada | MPa |
| P_op | Pressão de operação atual | MPa |
| t_atual | Espessura atual medida (menor valor) | mm |
| Ca | Sobre-espessura de corrosão | mm |
| t_efetiva | t_atual - Ca | mm |
| R | Raio interno atual | mm |
| D | Diâmetro interno atual | mm |
| S | Tensão admissível à T_operacao | MPa |
| E | Eficiência de junta | adimensional |

---

## Unidades
- **Pressão:** MPa (padrão) — 1 MPa = 10 bar
- **Espessura:** mm
- **Dimensões:** mm
- **Tensão:** MPa

---

## Restrições
1. **t_efetiva > 0** — senão: equipamento condenado
2. **t_efetiva > 2.5 mm** (regra EngeServ)
3. **PMTA ≥ P_operacao** — senão: redução de pressão ou parada
4. Temperatura ≤ limite material (ASME II-D)
5. Diâmetro atual = Diâmetro original (despreza expansão térmica permanente)

---

## Premissas
1. **Elemento governante** = elemento com menor t_efetiva / maior tensão
2. Espessura medida = menor valor entre todas as medições do elemento
3. Ca = valor original de projeto (ou padrão por material/fluido)
4. S = tensão admissível à **temperatura de operação** (não projeto)
5. E = eficiência original (RT 100% = 1.0, pontual = 0.85, sem = 0.70)

---

## Fórmulas (Inversas das t_min)

### 1. Casco Cilíndrico — ASME VIII-1 UG-27(c)(1) invertido
```
P = (S × E × t_efetiva) / (R + 0.6 × t_efetiva)
```
**Onde:** t_efetiva = t_atual - Ca

**Válido para:** t_efetiva < R/2 (casco fino)

---

### 2. Casco Esférico — ASME VIII-1 UG-27(c)(2) invertido
```
P = (2 × S × E × t_efetiva) / (R - 0.4 × t_efetiva)
```

---

### 3. Tampo Elipsoidal 2:1 — ASME VIII-1 UG-32(d) invertido
```
P = (2 × S × E × t_efetiva) / (D + 0.2 × t_efetiva)
```

---

### 4. Tampo Torisférico — ASME VIII-1 UG-32(e) invertido
```
P = (2 × S × E × t_efetiva) / (M × D - 0.2 × t_efetiva)
```
**Onde M = fator de forma (conforme L/r do torisférico)**

---

### 5. Tampo Hemisférico — ASME VIII-1 UG-32(c) invertido
```
P = (2 × S × E × t_efetiva) / (R - 0.4 × t_efetiva)
```
**Igual ao casco esférico** (hemisférico = meia esfera)

---

### 6. Tampo Cônico — ASME VIII-1 UG-32(g) invertido
```
P = (2 × S × E × t_efetiva × cos(α)) / (D + 0.6 × t_efetiva)
```
**Onde α = semi-ângulo do cone (graus)**

---

### 7. Caldeira — ASME I PG-27 invertido
```
P = (S × E × t_efetiva) / (R + y × t_efetiva)
```
**Onde y = 0.4 (T ≤ 480°C) ou 0.7 (T > 480°C)**

---

### 7. Tubulação — ASME B31.3 304.1.2 invertido
```
P = (2 × S × E × t_efetiva) / (D - 2 × y × t_efetiva)
```
**Onde y = 0.4 (T ≤ 480°C)**

---

### 8. Tanque Atmosférico — API 650 5.6 invertido
```
P = (2 × S × E × t_efetiva) / D
```
**Nota:** P = pressão hidrostática, não pressão de projeto. P_max na base = ρ × g × h_max

---

## Elemento Governante

**Regra:** O elemento que resulta na **menor PMTA** governa o equipamento inteiro.

**Elementos a verificar:**
1. Casco cilíndrico (menor t_efetiva do casco)
2. Tampo superior (elipsoidal/torisférico/hemisférico/cônico)
3. Tampo inferior
4. Bocais/reforços (se aplicável)
5. Costuras longitudinais vs circunferenciais (E diferente)

---

## Classificação do Resultado

| Status | Critério | Ação |
|---|---|---|
| **OK** | PMTA ≥ P_operacao × 1.1 | Operação normal |
| **ATENÇÃO** | P_operacao ≤ PMTA < P_operacao × 1.1 | Monitorar, não aumentar carga |
| **RED. PRESSÃO** | PMTA < P_operacao | Reduzir P_operacao para PMTA × 0.9 |
| **PARADA** | PMTA < P_operacao × 0.9 | Parada imediata |
| **CONDENADO** | t_efetiva ≤ 0 ou PMTA < P_vazio | Fora de serviço |

---

## Exemplo: Vaso V-401 (Braskem) — REJEITADO

**Dados atuais (Inspeção 12/05/2024):**
- P_operacao = 10.0 bar = 1.0 MPa
- t_atual (P3) = 4.2 mm (menor casco)
- Ca = 3.0 mm (aço carbono + ar comprimido)
- t_efetiva = 4.2 - 3.0 = **1.2 mm**
- R = 400 mm (D=800mm)
- Material: SA-516 Gr.70
- T_operacao = 60°C → S = 138 MPa
- E = 1.0 (RT 100%)

**Cálculo PMTA (Casco Cilíndrico):**
```
t_efetiva = 1.2 mm
R = 400 mm
P = (138 × 1.0 × 1.2) / (400 + 0.6 × 1.2)
P = 165.6 / 400.72 = 0.413 MPa = **4.13 bar**
```

**Resultado:**
- PMTA = **4.13 bar**
- P_operacao = **10.0 bar**
- **PMTA < P_operacao** → **VIOLAÇÃO CRÍTICA**
- t_efetiva (1.2 mm) < 2.5 mm → **REGRA 2.5mm VIOLADA**
- **Status: CONDENADO / PARADA IMEDIATA**

---

## Exemplo: Vaso V-101 (Petrobras) — APROVADO

**Dados:**
- P_operacao = 20 bar = 2.0 MPa
- t_atual (P3) = 11.5 mm
- Ca = 3.0 mm
- t_efetiva = 8.5 mm
- R = 500 mm
- SA-516 Gr.70, T_op = 85°C → S = 138 MPa
- E = 1.0

**Cálculo:**
```
P = (138 × 1.0 × 8.5) / (500 + 0.6 × 8.5)
P = 1173 / 505.1 = 2.32 MPa = **23.2 bar**
```

**Resultado:**
- PMTA = **23.2 bar**
- P_operacao = **20 bar**
- Margem = 16% (> 10%)
- **Status: OK**

---

## Dados para Testes Unitários

| Caso | Input | Expected PMTA |
|---|---|---|
| Cilíndrico OK | t=8.5, R=500, S=138, E=1.0, Ca=3.0 | ~2.32 MPa (23.2 bar) |
| Cilíndrico CRÍTICO | t=4.2, R=400, S=138, E=1.0, Ca=3.0 | ~0.41 MPa (4.1 bar) |
| Elipsoidal | t=8.0, D=1000, S=138, E=1.0, Ca=3.0 | ~1.85 MPa |
| Torisférico M=1.15 | t=7.0, D=1000, S=138, E=1.0, Ca=3.0, M=1.15 | ~1.62 MPa |
| Esférico | t=8.5, R=500, S=138, E=1.0, Ca=3.0 | ~2.32 MPa |
| Regra 2.5mm | t=4.2, Ca=3.0 → t_eff=1.2 | FLAG: CONDENADO |
| PMTA < P_op | PMTA=4.1, P_op=10.0 | FLAG: VIOLAÇÃO |

---

## Status de Implementação

| Funcionalidade | Status | Arquivo |
|---|---|---|
| PMTA Cilíndrico | [x] Placeholder | `mawp.ts` |
| PMTA Esférico | [x] Placeholder | `mawp.ts` |
| PMTA Elipsoidal | [x] Placeholder | `mawp.ts` |
| PMTA Torisférico | [x] Placeholder | `mawp.ts` |
| PMTA Hemisférico | [x] Placeholder | `mawp.ts` |
| PMTA Cônico | [x] Placeholder | `mawp.ts` |
| Elemento Governante | [ ] Pendente | `services/engine.ts` |
| Classificação status | [ ] Pendente | `services/engine.ts` |
| Regra 2.5mm | [x] Domain | `domain/entities.ts` |

---

## Referências
1. ASME BPVC VIII-1 (2021) — UG-27, UG-32, UG-16
2. ASME BPVC I (2021) — PG-27
3. API 570 (2016) — 7.4 MAWP Determination
4. API 510 (2020) — 6.4 MAWP Determination
5. ASME B31.3 (2020) — 304.1.2
5. API 650 (2020) — 5.6
6. NR-13 (2023) — 13.5.2

---

**Última atualização:** 21/07/2026  
**Responsável:** Engenheiro Responsável EngeServ  
**Próxima revisão:** Após validação Sprint 5