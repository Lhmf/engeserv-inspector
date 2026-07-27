# ENGINEERING_FORMULAS.md

**Documento de Validação de Fórmulas NR-13/ASME/API — EngeServ Inspector**

> Este documento serve como template para o engenheiro responsável validar cada fórmula antes da implementação.
> **NÃO IMPLEMENTAR CÁLCULOS** — apenas preencher os templates abaixo.
> Status: `[ ] Não iniciado  [ ] Em validação  [ ] Validado  [ ] Implementado`

---

## ÍNDICE DE CÁLCULOS

| # | Cálculo | Norma Principal | Status |
|---|---------|----------------|--------|
| 1 | Espessura Mínima — Casco Cilíndrico (Pressão Interna) | ASME VIII-1 UG-27 | [ ] Não iniciado |
| 2 | Espessura Mínima — Tampo Elipsoidal | ASME VIII-1 UG-32 | [ ] Não iniciado |
| 3 | Espessura Mínima — Tampo Torisférico | ASME VIII-1 UG-32 | [ ] Não iniciado |
| 4 | Espessura Mínima — Tampo Hemisférico | ASME VIII-1 UG-32 | [ ] Não iniciado |
| 5 | Espessura Mínima — Tampo Cônico | ASME VIII-1 UG-32 | [ ] Não iniciado |
| 6 | Espessura Mínima — Casco Esférico | ASME VIII-1 UG-27 | [ ] Não iniciado |
| 7 | Espessura Mínima — Tanque Atmosférico (API 650) | API 650 | [ ] Não iniciado |
| 8 | Taxa de Corrosão (2 Inspeções) | API 570 / API 510 | [ ] Não iniciado |
| 9 | Taxa de Corrosão (Regressão Linear — 3+ Inspeções) | API 570 / API 510 | [ ] Não iniciado |
| 10 | Vida Útil Remanescente | API 570 / API 510 | [ ] Não iniciado |
| 11 | PMTA (MAWP) — Casco Cilíndrico | ASME VIII-1 UG-27 (inverso) | [ ] Não iniciado |
| 12 | PMTA (MAWP) — Tampo Elipsoidal | ASME VIII-1 UG-32 (inverso) | [ ] Não iniciado |
| 13 | PMTA (MAWP) — Tampo Torisférico | ASME VIII-1 UG-32 (inverso) | [ ] Não iniciado |
| 14 | PMTA (MAWP) — Casco Esférico | ASME VIII-1 UG-27 (inverso) | [ ] Não iniciado |
| 15 | Classificação de Criticidade (Espessura) | NR-13 + API 581 | [ ] Não iniciado |
| 16 | Intervalo de Próxima Inspeção | NR-13 13.7 / API 510/570 | [ ] Não iniciado |
| 17 | Pressão de Projeto vs Operação vs MAWP | ASME VIII-1 UG-20/21 | [ ] Não iniciado |
| 18 | Eficiência de Junta (E) por Tipo de Solda/RT | ASME VIII-1 UW-12 | [ ] Não iniciado |
| 19 | Sobre-espessura de Corrosão (Ca) por Material/Flúido | ASME VIII-1 / NR-13 | [ ] Não iniciado |
| 20 | Tensão Admissível (S) por Material e Temperatura | ASME VIII-1 Section II Part D | [ ] Não iniciado |

---

## TEMPLATE PADRÃO PARA CADA FÓRMULA

> **Copie este template para cada cálculo abaixo e preencha completamente.**

### [NÚMERO] — [NOME DA FÓRMULA]

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | O que este cálculo determina |
| **Norma de Referência** | Ex: ASME BPVC VIII-1 2021, API 570 2016, NR-13 2023 |
| **Capítulo/Seção** | Ex: UG-27(c)(1), 7.2, 13.5.2 |
| **Equipamentos Aplicáveis** | Ex: Vaso de pressão, Caldeira, Tanque, Tubulação |
| **Variáveis** | Lista completa com símbolos |
| **Unidade de Cada Variável** | Tabela variável → unidade |
| **Restrições** | Limites de aplicação (ex: R/t > 10, P < 0.385SE) |
| **Premissas** | Suposições da fórmula (ex: material isotrópico, casco fino) |
| **Fórmula Matemática** | Em LaTeX ou texto claro |
| **Explicação Técnica** | Derivação, origem, quando usar |
| **Exemplo Resolvido Manualmente** | Passo a passo com números |
| **Caso de Teste** | Input JSON para teste automatizado |
| **Resultado Esperado** | Output JSON esperado |
| **Status** | [ ] Não iniciado  [ ] Em validação  [ ] Validado  [ ] Implementado |
| **Observações do Engenheiro** | Campo livre para notas |

---

## 1 — ESPESURA MÍNIMA: CASCO CILÍNDRICO (PRESSÃO INTERNA)

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Calcular a espessura mínima requerida (t_min) para casco cilíndrico sob pressão interna |
| **Norma de Referência** | |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | ```json { "input": {}, "expected": {} } ``` |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 2 — ESPESURA MÍNIMA: TAMPO ELIPSOIDAL

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 3 — ESPESURA MÍNIMA: TAMPO TORISFÉRICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 4 — ESPESURA MÍNIMA: TAMPO HEMISFÉRICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 5 — ESPESURA MÍNIMA: TAMPO CÔNICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 6 — ESPESURA MÍNIMA: CASCO ESFÉRICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 7 — ESPESURA MÍNIMA: TANQUE ATMOSFÉRICO (API 650)

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Calcular espessura mínima de anéis de tanque atmosférico |
| **Norma de Referência** | API 650 (2020 ou versão vigente) |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | Tanques atmosféricos (Tipo TANQUE) |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 8 — TAXA DE CORROSÃO: DUAS INSPEÇÕES

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Calcular taxa de corrosão (mm/ano) entre duas inspeções consecutivas |
| **Norma de Referência** | API 570 (tubulação) / API 510 (vasos) |
| **Capítulo/Seção** | API 570 7.2 / API 510 6.2 |
| **Equipamentos Aplicáveis** | Todos com medições históricas |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | CR = (t_anterior - t_atual) / Δt |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | ```json { "input": { "t_anterior_mm": 12.0, "t_atual_mm": 11.5, "intervalo_anos": 2.5 }, "expected": { "corrosion_rate_mm_ano": 0.2 } } ``` |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 9 — TAXA DE CORROSÃO: REGRESSÃO LINEAR (3+ INSPEÇÕES)

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Calcular taxa de corrosão usando regressão linear com 3+ pontos históricos |
| **Norma de Referência** | API 570 / API 510 |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | Equipamentos com histórico de 3+ inspeções |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | Regressão linear: t = a + b·tempo; CR = -b |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 10 — VIDA ÚTIL REMANESCENTE

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Determinar quantos anos até a espessura atingir o mínimo admissível |
| **Norma de Referência** | API 570 / API 510 / NR-13 |
| **Capítulo/Seção** | API 570 7.4 / API 510 6.4 |
| **Equipamentos Aplicáveis** | Todos com taxa de corrosão conhecida |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | Vida = (t_atual - t_mínima - margem_segurança) / taxa_corrosão |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | ```json { "input": { "t_atual_mm": 10.0, "t_minima_mm": 5.5, "taxa_corrosao_mm_ano": 0.15, "margem_seguranca_mm": 1.0 }, "expected": { "vida_remanescente_anos": 23.3 } } ``` |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 11 — PMTA (MAWP): CASCO CILÍNDRICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Calcular Pressão Máxima de Trabalho Admissível baseada na espessura atual |
| **Norma de Referência** | ASME VIII-1 UG-27 (inverso) |
| **Capítulo/Seção** | UG-27(c)(1) invertido |
| **Equipamentos Aplicáveis** | Vasos de pressão, Caldeiras |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | P = (S × E × t) / (R + 0.6 × t)  (onde t = espessura_atual - Ca) |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 12 — PMTA (MAWP): TAMPO ELIPSOIDAL

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | ASME VIII-1 UG-32 (inverso) |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 13 — PMTA (MAWP): TAMPO TORISFÉRICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | ASME VIII-1 UG-32 (inverso) |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 14 — PMTA (MAWP): CASCO ESFÉRICO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | |
| **Norma de Referência** | ASME VIII-1 UG-27 (esférico, inverso) |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | P = (2 × S × E × t) / (R - 0.4 × t) |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 15 — CLASSIFICAÇÃO DE CRITICIDADE (ESPESSURA)

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Classificar ponto de medição em OK / ATENÇÃO / CRÍTICO |
| **Norma de Referência** | NR-13 + API 581 (adaptado) |
| **Capítulo/Seção** | NR-13 13.5 / API 581 |
| **Equipamentos Aplicáveis** | Todos com medições de ultrassom |
| **Variáveis** | t_atual, t_mínima |
| **Unidade de Cada Variável** | mm |
| **Restrições** | t_mínima > 0 |
| **Premissas** | Regra de negócio EngeServ: "camisa > 2,5mm desconsiderando corrosão adicional" |
| **Fórmula Matemática** | % = (t_atual - t_mínima) / t_mínima × 100<br>CRÍTICO: t_atual ≤ t_mínima<br>ATENÇÃO: t_atual ≤ 1.2 × t_mínima<br>OK: t_atual > 1.2 × t_mínima |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | t_mín=5.5, t_atual=5.2 → 5.2 ≤ 5.5 → CRÍTICO<br>t_mín=5.5, t_atual=6.2 → 6.2 ≤ 6.6 → ATENÇÃO<br>t_mín=5.5, t_atual=7.0 → 7.0 > 6.6 → OK |
| **Caso de Teste** | ```json { "input": { "t_atual_mm": 5.2, "t_minima_mm": 5.5 }, "expected": { "status": "CRITICO", "margem_percentual": -5.45 } } ``` |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | **CONFIRMAR: Valor 2,5mm é fixo para todos os equipamentos ou varia por tipo/norma?** |

---

## 16 — INTERVALO DE PRÓXIMA INSPEÇÃO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Determinar data/intervalo da próxima inspeção periódica |
| **Norma de Referência** | NR-13 13.7 / API 510 / API 570 |
| **Capítulo/Seção** | NR-13 13.7.2, API 510 6.4, API 570 7.4 |
| **Equipamentos Aplicáveis** | Todos |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 17 — PRESSÃO DE PROJETO vs OPERAÇÃO vs MAWP

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Validar relacionamento: MAWP ≥ Pressão de Operação; Pressão de Projeto ≥ MAWP |
| **Norma de Referência** | ASME VIII-1 UG-20, UG-21 |
| **Capítulo/Seção** | |
| **Equipamentos Aplicáveis** | Vasos de pressão |
| **Variáveis** | |
| **Unidade de Cada Variável** | |
| **Restrições** | |
| **Premissas** | |
| **Fórmula Matemática** | Validação lógica: P_projeto ≥ MAWP ≥ P_operacao |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 18 — EFICIÊNCIA DE JUNTA (E) POR TIPO DE SOLDAS/RT

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Determinar eficiência de junta soldada (E) baseada no tipo de junta e exame radiográfico |
| **Norma de Referência** | ASME VIII-1 UW-12 |
| **Capítulo/Seção** | UW-12, Tabela UW-12 |
| **Equipamentos Aplicáveis** | Vasos de pressão, Caldeiras |
| **Variáveis** | Tipo de junta, % RT, tipo de solda |
| **Unidade de Cada Variável** | Adimensional (0 a 1) |
| **Restrições** | 0 < E ≤ 1 |
| **Premissas** | |
| **Fórmula Matemática** | Tabela: Junta longa RT 100% = 1.0; RT pontual = 0.85; Sem RT = 0.7<br>Junta circunferencial: RT 100% = 1.0; outros = 0.7 |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 19 — SOBRE-ESPESSURA DE CORROSÃO (Ca) POR MATERIAL/FLÚIDO

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Definir sobre-espessura de corrosão padrão por combinação material/fluido |
| **Norma de Referência** | ASME VIII-1 / NR-13 / Prática EngeServ |
| **Capítulo/Seção** | UG-25 / NR-13 13.5.2 |
| **Equipamentos Aplicáveis** | Todos |
| **Variáveis** | Material, Fluido, Temperatura |
| **Unidade de Cada Variável** | mm |
| **Restrições** | Ca ≥ 0 |
| **Premissas** | |
| **Fórmula Matemática** | Tabela de referência (ex: aço carbono + água = 3mm; inox + água = 1.5mm) |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | |
| **Caso de Teste** | |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## 20 — TENSÃO ADMISSÍVEL (S) POR MATERIAL E TEMPERATURA

| Campo | Preenchimento |
|-------|---------------|
| **Objetivo** | Obter tensão admissível do material à temperatura de projeto |
| **Norma de Referência** | ASME BPVC Section II Part D |
| **Capítulo/Seção** | Tabelas 1A, 1B, 4, 5A |
| **Equipamentos Aplicáveis** | Todos (ASME) |
| **Variáveis** | Material (spec/grade), Temperatura de projeto |
| **Unidade de Cada Variável** | MPa |
| **Restrições** | Temperatura dentro dos limites da tabela |
| **Premissas** | Interpolação linear entre temperaturas tabeladas |
| **Fórmula Matemática** | Interpolação linear na tabela S vs T do material |
| **Explicação Técnica** | |
| **Exemplo Resolvido Manualmente** | SA-516 Gr.70 a 150°C → interpolar entre 100°C (138 MPa) e 150°C (133 MPa) |
| **Caso de Teste** | ```json { "input": { "material": "SA-516_GR70", "temperature_c": 150 }, "expected": { "allowable_stress_mpa": 133 } } ``` |
| **Resultado Esperado** | |
| **Status** | [ ] Não iniciado |
| **Observações do Engenheiro** | |

---

## ANEXO: GLOSSÁRIO DE SÍMBOLOS

| Símbolo | Significado | Unidade Padrão |
|---------|-------------|----------------|
| t, t_min | Espessura mínima requerida | mm |
| t_nom | Espessura nominal (com tolerância) | mm |
| t_atual | Espessura medida (menor valor) | mm |
| t_anterior | Espessura de inspeção anterior | mm |
| Ca | Sobre-espessura de corrosão | mm |
| P, P_int | Pressão interna de projeto | bar / MPa |
| P_op | Pressão de operação | bar / MPa |
| MAWP, P_max | Pressão máxima admissível de trabalho | bar / MPa |
| P_hid | Pressão de teste hidrostático | bar / MPa |
| S | Tensão admissível do material | MPa |
| E | Eficiência de junta soldada | adimensional (0-1) |
| R | Raio interno do casco | mm |
| D | Diâmetro interno | mm |
| CR | Taxa de corrosão | mm/ano |
| Vida | Vida útil remanescente | anos |
| Δt | Intervalo entre inspeções | anos |
| σ_y, Sy | Limite de escoamento | MPa |
| σ_u, Su | Resistência à tração | MPa |

---

## ANEXO: NORMAS DE REFERÊNCIA E VERSÕES

| Norma | Versão | Aplicação |
|-------|--------|-----------|
| NR-13 | 2023 (ou vigente) | Requisitos legais brasileiros |
| ASME BPVC VIII-1 | 2021 | Vasos de pressão (projeto, fabricação, inspeção) |
| ASME BPVC I | 2021 | Caldeiras de potência |
| ASME B31.3 | 2020 | Tubulação de processo |
| API 510 | 2020 | Inspeção de vasos de pressão |
| API 570 | 2016 | Inspeção de tubulação |
| API 650 | 2020 | Tanques atmosféricos |
| API 653 | 2014 | Inspeção de tanques |
| API 581 | 2016 | RBI (Risk-Based Inspection) — referência para criticidade |

---

## CHECKLIST DE VALIDAÇÃO GERAL

- [ ] Todas as fórmulas têm norma, capítulo, equipamentos, variáveis, unidades, restrições, premissas
- [ ] Todos os exemplos resolvidos manualmente conferidos
- [ ] Todos os casos de teste têm input/output JSON válidos
- [ ] Regra de negócio "camisa > 2,5mm" confirmada (fixa ou variável?)
- [ ] Tensões admissíveis por material/temperatura confirmadas
- [ ] Eficiência de junta (E) por tipo de solda/RT confirmada
- [ ] Sobre-espessura de corrosão (Ca) por material/fluido confirmada
- [ ] Intervalos de inspeção por tipo de equipamento confirmados
- [ ] Engenheiro responsável assinou/validou cada fórmula

---

**Responsável Técnico:** _________________________  
**Data:** _________________________  
**Assinatura:** _________________________