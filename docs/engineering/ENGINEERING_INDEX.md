# ENGINEERING_INDEX.md

**Índice Mestre da Base de Conhecimento de Engenharia — EngeServ Inspector**

> Este índice é a fonte de verdade para o Engineering Engine e para a IA do sistema.
> Cada cálculo implementado no código deve ter correspondência aqui.

---

## 1. ESTRUTURA DA BASE DE CONHECIMENTO

```
docs/engineering/
├── ENGINEERING_INDEX.md          ← Este arquivo
├── materials.md                  # Materiais e tensões admissíveis
├── corrosion.md                  # Corrosão e taxas
├── remaining-life.md             # Vida útil remanescente
├── minimum-thickness.md          # Espessura mínima admissível
├── mawp.md                       # PMTA (Pressão Máxima de Trabalho Admissível)
├── hydrostatic-test.md           # Teste hidrostático
├── inspection-intervals.md       # Intervalos de inspeção
├── safety-factors.md             # Coeficientes de segurança
├── equipment-types.md            # Tipos de equipamento NR-13
├── standards/
│   ├── nr13.md                   # NR-13 (Regulamentação brasileira)
│   ├── asme.md                   # ASME BPVC (VIII-1, I, B31.3)
│   ├── api510.md                 # API 510 (Inspeção de vasos)
│   ├── api570.md                 # API 570 (Inspeção de tubulação)
│   └── api579.md                 # API 579 (Avaliação de integridade)
└── formulas/                     # (Opcional) Fórmulas individuais
```

---

## 2. CATÁLOGO DE CÁLCULOS (Rastreabilidade)

| # | Cálculo | Norma Principal | Capítulo | Documento | Arquivo TS | Teste Unitário | Caso Real | Status |
|---|---------|----------------|----------|-----------|------------|----------------|-----------|--------|
| 1 | Espessura Mínima — Casco Cilíndrico | ASME VIII-1 | UG-27(c)(1) | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | V-101 Petrobras | [ ] Placeholder |
| 2 | Espessura Mínima — Tampo Elipsoidal | ASME VIII-1 | UG-32(d) | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | V-101 Petrobras | [ ] Placeholder |
| 3 | Espessura Mínima — Tampo Torisférico | ASME VIII-1 | UG-32(e) | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | V-401 Braskem | [ ] Placeholder |
| 4 | Espessura Mínima — Tampo Hemisférico | ASME VIII-1 | UG-32(c) | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | — | [ ] Placeholder |
| 5 | Espessura Mínima — Tampo Cônico | ASME VIII-1 | UG-32(g) | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | — | [ ] Placeholder |
| 6 | Espessura Mínima — Casco Esférico | ASME VIII-1 | UG-27(c)(2) | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | — | [ ] Placeholder |
| 7 | Espessura Mínima — Tanque Atmosférico | API 650 | 5.6.x | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | T-301 Vale | [ ] Placeholder |
| 8 | Taxa de Corrosão (2 Inspeções) | API 570/510 | 7.2/6.2 | corrosion.md | `corrosion-rate.ts` | `corrosion-rate.test.ts` | V-101 Petrobras | [ ] Placeholder |
| 9 | Taxa de Corrosão (Regressão Linear) | API 570/510 | 7.3/6.3 | corrosion.md | `corrosion-rate.ts` | `corrosion-rate.test.ts` | — | [ ] Placeholder |
| 10 | Vida Útil Remanescente | API 570/510 | 7.4/6.4 | remaining-life.md | `remaining-life.ts` | `remaining-life.test.ts` | V-101 Petrobras | [ ] Placeholder |
| 11 | PMTA — Casco Cilíndrico | ASME VIII-1 | UG-27 (inv.) | mawp.md | `mawp.ts` | `mawp.test.ts` | V-101 / V-401 | [ ] Placeholder |
| 12 | PMTA — Tampo Elipsoidal | ASME VIII-1 | UG-32(d) (inv.) | mawp.md | `mawp.ts` | `mawp.test.ts` | V-101 Petrobras | [ ] Placeholder |
| 13 | PMTA — Tampo Torisférico | ASME VIII-1 | UG-32(e) (inv.) | mawp.md | `mawp.ts` | `mawp.test.ts` | V-401 Braskem | [ ] Placeholder |
| 14 | PMTA — Casco Esférico | ASME VIII-1 | UG-27(c)(2) (inv.) | mawp.md | `mawp.ts` | `mawp.test.ts` | — | [ ] Placeholder |
| 15 | Classificação Criticidade (Espessura) | NR-13 + API 581 | 13.5.x | minimum-thickness.md | `minimum-thickness.ts` | `minimum-thickness.test.ts` | V-101 / V-401 | [ ] Placeholder |
| 16 | Intervalo Próxima Inspeção | NR-13/API 510/570 | 13.7 / 6.4 / 7.4 | inspection-intervals.md | *(futuro)* | *(futuro)* | V-101 Petrobras | [ ] Pendente |
| 17 | Pressão Projeto vs Operação vs MAWP | ASME VIII-1 | UG-20/21 | mawp.md | *(validação)* | *(futuro)* | V-401 Braskem | [ ] Pendente |
| 18 | Eficiência de Junta (E) | ASME VIII-1 | UW-12 | materials.md | *(futuro)* | *(futuro)* | Todos | [ ] Pendente |
| 19 | Sobre-espessura Corrosão (Ca) | ASME VIII-1/NR-13 | UG-25/13.5.2 | corrosion.md | *(futuro)* | *(futuro)* | Todos | [ ] Pendente |
| 20 | Tensão Admissível (S) por Material/Temp | ASME II-D | Tabelas 1A/1B/4/5A | materials.md | *(futuro)* | *(futuro)* | Todos | [ ] Pendente |

**Legenda Status:**
- `[ ] Placeholder` — Calculator existe mas retorna WARNING/TEORETICAL
- `[ ] Validado` — Fórmula confirmada pelo engenheiro, pronta para implementar
- `[ ] Implementado` — Código final no lugar do placeholder
- `[ ] Testado` — Testes unitários passando com valores reais
- `[ ] Pendente` — Ainda não tem calculator

---

## 3. DOCUMENTOS POR ASSUNTO

### 3.1 Materiais (`materials.md`)
- Tensões admissíveis (S) por material, grau e temperatura
- Limites de escoamento (Sy) e tração (Su)
- Eficiência de junta (E) por tipo de solda e RT
- Materiais comuns EngeServ: SA-516 Gr.70/60, SA-36, SA-240 316L/304L, A-36
- Interpolação linear de S vs Temperatura

### 3.2 Corrosão (`corrosion.md`)
- Taxa de corrosão (mm/ano) — 2 pontos vs regressão linear
- Sobre-espessura de corrosão (Ca) por material/fluido/temperatura
- Fatores de corrosão: galvânica, pitting, fresta, tensão
- Monitoramento: coupons, sondas, medições ultrassom

### 3.3 Vida Útil (`remaining-life.md`)
- Cálculo: (t_atual - t_mínima - margem) / taxa_corrosão
- Margens de segurança recomendadas
- Critérios de aposentadoria vs reparo vs monitoramento
- Projeção de espessura em data futura

### 3.4 Espessura Mínima (`minimum-thickness.md`)
- Casco cilíndrico (UG-27)
- Tampo elipsoidal (UG-32d)
- Tampo torisférico (UG-32e)
- Tampo hemisférico (UG-32c)
- Tampo cônico (UG-32g)
- Casco esférico (UG-27c2)
- Tanque atmosférico (API 650)
- Regra EngeServ: "camisa > 2,5mm desconsiderando corrosão adicional"

### 3.5 PMTA/MAWP (`mawp.md`)
- Cálculo inverso da espessura mínima
- Elemento governante (menor PMTA entre casco/tampos/bocais)
- Validação: MAWP ≥ Pressão de Operação
- Reclassificação se MAWP < P_operacao

### 3.6 Teste Hidrostático (`hydrostatic-test.md`)
- PTH = 1.3 × PMTA (ASME VIII-1 UG-99)
- PTH = 1.5 × P_projeto (NR-13 13.6.2)
- Pressão de teste por estágio de fabricação
- Aceitação: sem vazamento, deformação permanente

### 3.7 Intervalos de Inspeção (`inspection-intervals.md`)
- NR-13 13.7: Periódica, Extraordinária
- API 510 (vasos): ½ vida útil ou 10 anos (mín 5)
- API 570 (tubulação): Conforme RBI ou tabela
- RBI (API 581): Baseado em risco

### 3.8 Coeficientes de Segurança (`safety-factors.md`)
- ASME: 3.5 (tração) / 1.5 (escoamento) — histórico
- NR-13: Margem operacional, fator de projeto
- API 579: Fatores de avaliação (Nível 1/2/3)

### 3.9 Tipos de Equipamento (`equipment-types.md`)
- Caldeira (ASME I)
- Vaso de Pressão (ASME VIII-1)
- Silo (ASME VIII-1 + específico)
- Tanque Atmosférico (API 650)
- Tubulação (ASME B31.3 / API 570)
- Compressor (API 617/618 + vaso)
- Trocador de Calor (TEMA + ASME VIII-1)
- Reator (ASME VIII-1 + processo)

---

## 4. NORMAS (Standards)

| Norma | Versão | Documento | Aplicação |
|-------|--------|-----------|-----------|
| **NR-13** | 2023 (ou vigente) | `standards/nr13.md` | Requisitos legais brasileiros |
| **ASME BPVC VIII-1** | 2021 | `standards/asme.md` | Projeto/fabricação/inspeção vasos |
| **ASME BPVC I** | 2021 | `standards/asme.md` | Caldeiras de potência |
| **ASME B31.3** | 2020 | `standards/asme.md` | Tubulação de processo |
| **API 510** | 2020 | `standards/api510.md` | Inspeção vasos em operação |
| **API 570** | 2016 | `standards/api570.md` | Inspeção tubulação em operação |
| **API 579** | 2016 | `standards/api579.md` | Avaliação integridade (Fitness-for-Service) |
| **API 650** | 2020 | `standards/asme.md` | Tanques atmosféricos |
| **API 653** | 2014 | `standards/api570.md` | Inspeção tanques |
| **ASME II Part D** | 2021 | `standards/asme.md` | Tensões admissíveis (tabelas) |

---

## 5. CASOS REAIS (docs/cases/)

| Caso | Cliente | TAG | Tipo | Status | Arquivo |
|------|---------|-----|------|--------|---------|
| 1 | Petrobras | V-101 | Vaso Pressão | APROVADO | `V-101_Petrobras_VasoPressao.md` |
| 2 | Braskem | V-401 | Vaso Pressão | REJEITADO | `V-401_Braskem_VasoPressao_REJEITADO.md` |
| 3 | Vale | C-201 | Caldeira | AGUARDANDO | *(futuro)* |
| 4 | Braskem | T-301 | Tanque | APROVADO | *(futuro)* |
| 5 | Raízen | TC-501 | Trocador Calor | EM_ANDAMENTO | *(futuro)* |
| 6 | Ultrapar | S-601 | Silo | EM_ANDAMENTO | *(futuro)* |

**Estrutura padrão de cada caso:**
```
Cliente / Equipamento / Dados de Projeto / Histórico / Medições / Resultado Esperado / Fotos / Conclusão
```

---

## 6. INTEGRAÇÃO COM ENGINEERING ENGINE

### Mapeamento Documento → Código

| Documento | Calculator TS | Função Principal |
|-----------|---------------|------------------|
| minimum-thickness.md | `MinimumThicknessCalculator` | `calculate(t_min)` |
| corrosion.md | `CorrosionRateCalculator` | `calculate(CR)` |
| remaining-life.md | `RemainingLifeCalculator` | `calculate(vida)` |
| mawp.md | `MawpCalculator` | `calculate(PMTA)` |
| materials.md | *(validação)* | `getAllowableStress()` |
| corrosion.md (Ca) | *(futuro)* | `getCorrosionAllowance()` |

### Fluxo de Uso da IA
1. IA recebe pergunta técnica → consulta `ENGINEERING_INDEX.md`
2. Identifica documento relevante → lê seção específica
3. Se for cálculo → invoca `EngineeringUseCaseFactory.createXUseCase()`
4. Retorna `CalculationResult` com explicação normativa

---

## 7. VERSIONAMENTO

| Versão | Data | Alteração | Responsável |
|--------|------|-----------|-------------|
| 1.0.0 | 21/07/2026 | Criação inicial (Sprint 5) | Hermes/Engenheiro |

---

## 8. PRÓXIMOS PASSOS (Sprint 5+)

- [ ] Engenheiro preencher todos os documentos `.md` em `docs/engineering/`
- [ ] Engenheiro validar `ENGINEERING_FORMULAS.md` (20 cálculos)
- [ ] Engenheiro adicionar casos reais em `docs/cases/`
- [ ] Substituir placeholders em `src/modules/engineering/calculations/`
- [ ] Implementar calculators restantes (intervalos, eficiência junta, Ca, S por temp)
- [ ] Integrar na API `/api/engineering/analyze`
- [ ] Integrar no Wizard passo 3/5 (tempo real)
- [ ] Integrar na geração de Laudo (Sprint 6)

---

**Última atualização:** 21/07/2026  
**Responsável pela base:** Engenheiro Responsável EngeServ  
**Mantenedor técnico:** Hermes (IA) / Equipe Dev