# Exemplo Real EngeServ — Vaso de Pressão V-401 (Braskem) — REJEITADO

## 1. IDENTIFICAÇÃO DO EQUIPAMENTO

| Campo | Valor |
|-------|-------|
| **Cliente** | Braskem S.A. |
| **TAG** | V-401 |
| **Tipo** | Vaso de Pressão (VASO_DE_PRESSAO) |
| **Descrição** | Vaso de pressão - compressor de ar |
| **Fabricante** | Atlas Copco |
| **Ano Fabricação** | 2018 |
| **Número de Série** | AC-2018-445 |
| **Código de Projeto** | ASME SEC.VIII Div.1 / 2017 |

## 2. DADOS DE PROJETO

| Parâmetro | Valor | Unidade |
|-----------|-------|---------|
| Pressão de Projeto | 12.0 | bar |
| Temperatura de Projeto | 80 | °C |
| Pressão de Operação | 10.0 | bar |
| Temperatura de Operação | 60 | °C |
| PMTA (MAWP) | 12.0 | bar |
| Pressão Teste Hidrostático | 18.0 | bar |
| Espessura Nominal do Casco | 8.0 | mm |
| Espessura Mínima de Projeto | 4.5 | mm |
| Diâmetro Interno (estimado) | ~800 | mm |
| Material do Casco | SA-516 Gr.70 |
| Material dos Tampões | SA-516 Gr.70 |
| Tipo de Tampão | Torisférico |
| Espessura Nominal Tampão | 6.5 | mm |
| Volume | 2000 | L |
| Eficiência de Junta (E) | 1.0 | - |
| Tipo de Fluido | Ar Comprimido |
| Classe do Fluido (NR-13) | B |
| Grupo de Risco | 2 |
| Categoria NR-13 | II |

## 3. MEDIÇÕES DE ULTRASSOM — INSPEÇÃO PERIÓDICA 2024

**Data da Inspeção:** 12/05/2024  
**Inspetor:** João Inspetor  
**Tipo:** Periódica  
**Status:** REJEITADA

| Ponto | Espessura (mm) | Ângulo (°) | Localização | Observações |
|-------|----------------|------------|-------------|-------------|
| P1 | 7.8 | 0 | Casco - região superior | - |
| P2 | 7.5 | 45 | Casco - região média | - |
| P3 | 4.2 | 90 | Casco - região inferior | **CRÍTICO (< 5.5mm)** |

**Estatísticas:**
- Menor espessura casco: 4.2 mm (P3) — **ABAIXO DO MÍNIMO (5.5 mm)**
- Espessura média casco: 6.5 mm
- P3 está **23.6% ABAIXO** da espessura mínima de projeto

---

## 4. CÁLCULOS MANUAIS (PARA VALIDAÇÃO)

### 4.1 Classificação de Criticidade

| Ponto | t_atual (mm) | t_mín (mm) | Margem (mm) | Margem (%) | Status |
|-------|--------------|------------|-------------|------------|--------|
| P1 | 7.8 | 5.5 | +2.3 | +41.8% | OK |
| P2 | 7.5 | 5.5 | +2.0 | +36.4% | OK |
| P3 | 4.2 | 5.5 | -1.3 | -23.6% | **CRÍTICO** |

**Regra EngeServ:**
- CRÍTICO: t_atual ≤ t_mínima
- ATENÇÃO: t_atual ≤ 1.2 × t_mínima (≤ 6.6 mm)
- OK: t_atual > 1.2 × t_mínima

---

### 4.2 PMTA (MAWP) — Casco Cilíndrico (Verificação com Espessura Atual)

**Dados atuais (ponto governante P3):**
- t_atual (menor): 4.2 mm
- Ca: 3.0 mm (aço carbono + ar comprimido)
- t_efetiva = 4.2 - 3.0 = 1.2 mm **<< MÍNIMO ABSOLUTO (2.5 mm)**
- R_interno = 400 mm (D=800mm)
- S (SA-516 Gr.70 a 80°C): 138 MPa (tabela ASME II-D)
- E = 1.0

**Fórmula ASME VIII-1 UG-27(c)(1):**
P = (S × E × t) / (R + 0.6 × t)

**Cálculo:**
P = (138 × 1.0 × 1.2) / (400 + 0.6 × 1.2)
P = 165.6 / 400.72 = 0.413 MPa = **4.13 bar**

**Comparação:**
- PMTA calculada (estado atual): **4.13 bar**
- PMTA de projeto: 12.0 bar
- Pressão de operação: 10.0 bar
- **MAWP (4.13) < P_operacao (10.0)** ✗ **VIOLAÇÃO CRÍTICA**

---

### 4.3 Motivo da Rejeição (Formal)

> "Espessura mínima abaixo do permitido no ponto P3. Necessário reparo ou substituição. PMTA calculada (4.13 bar) inferior à pressão de operação (10.0 bar). Equipamento não atende requisitos de segurança da NR-13 e ASME VIII-1."

---

## 5. AÇÕES REQUERIDAS

1. **PARADA IMEDIATA** do equipamento
2. Avaliação de reparo: solda de reforço (pad) no ponto P3
3. Ou: Substituição do casco/trecho afetado
4. Nova inspeção após reparo (tipo EXTRAORDINARIA)
5. Aprovação do Gestor antes de retorno à operação

---

## 6. RESULTADO ESPERADO DO SISTEMA

### JSON de Entrada (CalculationInput)
```json
{
  "equipment": {
    "id": "eq-004",
    "tag": "V-401",
    "type": "VASO_DE_PRESSAO",
    "designPressureBar": 12.0,
    "originalThicknessMm": 8.0,
    "minThicknessMm": 5.5,
    "designTempC": 80,
    "operatingPressureBar": 10.0,
    "operatingTempC": 60,
    "mawpBar": 12.0,
    "hydroTestPressureBar": 18.0,
    "headType": "Torisférico",
    "bodyMaterial": "SA-516 Gr.70",
    "headMaterial": "SA-516 Gr.70",
    "volumeLiters": 2000,
    "jointEfficiency": 1.0,
    "corrosionAllowanceMm": 3.0,
    "fluidType": "Ar Comprimido",
    "fluidClass": "B",
    "riskGroup": 2,
    "nr13Category": "II"
  },
  "inspection": {
    "id": "insp-005",
    "equipmentId": "eq-004",
    "type": "PERIODICA",
    "status": "REJEITADA",
    "startedAt": "2024-05-12T00:00:00Z",
    "completedAt": "2024-05-12T00:00:00Z",
    "rejectionReason": "Espessura mínima abaixo do permitido no ponto P3. Necessário reparo ou substituição. PMTA calculada (4.13 bar) inferior à pressão de operação (10.0 bar)."
  },
  "measurements": [
    { "point": "P1", "thicknessMm": 7.8, "angleDeg": 0, "notes": "Casco - região superior" },
    { "point": "P2", "thicknessMm": 7.5, "angleDeg": 45, "notes": "Casco - região média" },
    { "point": "P3", "thicknessMm": 4.2, "angleDeg": 90, "notes": "Casco - região inferior - CRÍTICO (< 5.5mm)" }
  ]
}
```

### JSON de Saída Esperada (IntegrityAnalysis)
```json
{
  "equipmentId": "eq-004",
  "inspectionId": "insp-005",
  "analyzedAt": "2024-05-15T10:00:00Z",
  "minimumThickness": {
    "value": { "minimumThicknessMm": 5.5, "components": { "pressureComponentMm": 2.5, "corrosionAllowanceMm": 3.0, "totalMm": 5.5 } },
    "unit": "mm",
    "status": "SUCCESS",
    "criticality": "LOW",
    "explanation": "Espessura mínima de projeto inalterada",
    "normativeReference": "ASME VIII-1 UG-27 / NR-13 13.5.2",
    "reliability": "HIGH"
  },
  "corrosionRate": null,
  "remainingLife": {
    "value": { "remainingLifeYears": 0, "thicknessMarginMm": -1.3, "recommendedInspectionIntervalMonths": 0 },
    "unit": "anos",
    "status": "ERROR",
    "criticality": "CRITICAL",
    "explanation": "Espessura atual (4.2 mm) JÁ está abaixo da mínima (5.5 mm) — vida útil zero",
    "normativeReference": "API 570 7.4 / NR-13 13.7",
    "reliability": "HIGH"
  },
  "mawp": {
    "value": { "mawpBar": 4.13, "mawpMpa": 0.413, "governingThicknessMm": 1.2 },
    "unit": "bar",
    "status": "SUCCESS",
    "criticality": "CRITICAL",
    "explanation": "PMTA baseada no ponto governante P3 (t_efetiva=1.2mm). MAWP < P_operacao — VIOLAÇÃO",
    "normativeReference": "ASME VIII-1 UG-27 invertido",
    "reliability": "HIGH"
  },
  "overallStatus": "CONDENADO",
  "overallCriticality": "CRITICAL",
  "recommendations": [
    "EQUIPAMENTO CONDENADO — PARADA IMEDIATA",
    "Espessura no P3 (4.2 mm) está 23.6% ABAIXO do mínimo (5.5 mm)",
    "PMTA calculada (4.13 bar) < Pressão de operação (10.0 bar) — VIOLAÇÃO ASME/NR-13",
    "Reparo obrigatório: solda de reforço no P3 OU substituição do trecho",
    "Nova inspeção EXTRAORDINÁRIA após reparo antes de retorno à operação",
    "Notificar cliente e responsável técnico imediatamente"
  ],
  "riskFactors": [
    {
      "factor": "Espessura abaixo do mínimo",
      "description": "Ponto P3 com 4.2 mm vs mínimo 5.5 mm (-1.3 mm, -23.6%)",
      "severity": "CRITICAL",
      "mitigation": "Reparo por solda de reforço (pad) ou substituição do trecho"
    },
    {
      "factor": "PMTA inferior à pressão de operação",
      "description": "MAWP 4.13 bar < P_op 10.0 bar — risco de ruptura",
      "severity": "CRITICAL",
      "mitigation": "Parada imediata; não operar até reparo validado"
    },
    {
      "factor": "Espessura efetiva abaixo do absoluto (2.5 mm)",
      "description": "t_efetiva = 1.2 mm < 2.5 mm (regra de negócio EngeServ)",
      "severity": "CRITICAL",
      "mitigation": "Reparo deve restaurar espessura efetiva > 2.5 mm + Ca"
    }
  ]
}
```

---

## 7. OBSERVAÇÕES PARA VALIDAÇÃO

1. **Ponto P3 é o governante** — determina status do equipamento inteiro
2. **Sem taxa de corrosão** — não há inspeção anterior comparável; vida útil = 0
3. **Regra 2.5 mm violada** — t_efetiva = 1.2 mm < 2.5 mm (regra de negócio)
3. **Ação imediata requerida** — equipamento não pode operar neste estado
4. **Reparo deve considerar** Ca = 3.0 mm + margem → espessura final do pad ≥ 8.5 mm

---

**Engenheiro Responsável:** _________________________  
**Data da Validação:** _________________________  
**Assinatura:** _________________________