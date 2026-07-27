# Exemplo Real EngeServ — Vaso de Pressão V-101 (Petrobras)

## 1. IDENTIFICAÇÃO DO EQUIPAMENTO

| Campo | Valor |
|-------|-------|
| **Cliente** | Petrobras S.A. |
| **TAG** | V-101 |
| **Tipo** | Vaso de Pressão (VASO_DE_PRESSAO) |
| **Descrição** | Vaso de pressão para separação de gás/óleo |
| **Fabricante** | Jaraguá Equipamentos |
| **Ano Fabricação** | 2019 |
| **Número de Série** | JEQ-2019-0456 |
| **Código de Projeto** | ASME SEC.VIII Div.1 / 2017 |

## 2. DADOS DE PROJETO

| Parâmetro | Valor | Unidade |
|-----------|-------|---------|
| Pressão de Projeto | 25.0 | bar |
| Temperatura de Projeto | 120 | °C |
| Pressão de Operação | 20.0 | bar |
| Temperatura de Operação | 85 | °C |
| PMTA (MAWP) | 25.0 | bar |
| Pressão Teste Hidrostático | 37.5 | bar |
| Espessura Nominal do Casco | 12.0 | mm |
| Espessura Mínima de Projeto | 5.5 | mm |
| Diâmetro Interno (estimado) | ~1000 | mm |
| Material do Casco | SA-516 Gr.70 |
| Material dos Tampões | SA-516 Gr.70 |
| Tipo de Tampão | Semielíptico |
| Espessura Nominal Tampão | 10.0 | mm |
| Volume | 5000 | L |
| Eficiência de Junta (E) | 1.0 | - |
| Tipo de Fluido | Gás Natural / Óleo |
| Classe do Fluido (NR-13) | A |
| Grupo de Risco | 2 |
| Categoria NR-13 | II |

## 3. MEDIÇÕES DE ULTRASSOM — INSPEÇÃO PERIÓDICA 2024

**Data da Inspeção:** 15/01/2024  
**Inspetor:** João Inspetor  
**Tipo:** Periódica  
**Status:** APROVADA

| Ponto | Espessura (mm) | Ângulo (°) | Localização | Observações |
|-------|----------------|------------|-------------|-------------|
| P1 | 11.8 | 0 | Casco - região superior | - |
| P2 | 12.1 | 45 | Casco - região média | - |
| P3 | 11.5 | 90 | Casco - região inferior | - |
| P4 | 10.8 | 0 | Tampo superior | - |
| P5 | 10.5 | 0 | Tampo inferior | - |

**Estatísticas:**
- Menor espessura casco: 11.5 mm (P3)
- Menor espessura tampo: 10.5 mm (P5)
- Espessura média casco: 11.8 mm
- Espessura média tampo: 10.65 mm

## 4. HISTÓRICO DE INSPEÇÕES ANTERIORES

| Inspeção | Data | Menor Espessura (mm) | Tipo |
|----------|------|---------------------|------|
| Inicial (Fabricação) | 2019 | 12.0 (nominal) | Inicial |
| Periódica 2021 | 15/01/2021 | 11.9 | Periódica |
| Periódica 2024 | 15/01/2024 | 11.5 | Periódica |

## 5. CÁLCULOS MANUAIS (PARA VALIDAÇÃO)

### 5.1 Taxa de Corrosão (2021 → 2024)

**Dados:**
- t_anterior (2021): 11.9 mm
- t_atual (2024): 11.5 mm
- Δt: 3.0 anos

**Fórmula:** CR = (t_anterior - t_atual) / Δt

**Cálculo:** CR = (11.9 - 11.5) / 3.0 = 0.4 / 3.0 = **0.133 mm/ano**

---

### 5.2 Vida Útil Remanescente

**Dados:**
- t_atual (mínima casco): 11.5 mm
- t_mínima projeto: 5.5 mm
- CR: 0.133 mm/ano
- Margem de segurança: 1.0 mm (padrão EngeServ)

**Fórmula:** Vida = (t_atual - t_mínima - margem) / CR

**Cálculo:** Vida = (11.5 - 5.5 - 1.0) / 0.133 = 5.0 / 0.133 = **37.6 anos**

---

### 5.3 Classificação de Criticidade

**Pontos do casco (t_mín = 5.5 mm):**

| Ponto | t_atual | t_mín | Status | Margem % |
|-------|---------|-------|--------|----------|
| P1 | 11.8 | 5.5 | OK | +114.5% |
| P2 | 12.1 | 5.5 | OK | +120.0% |
| P3 | 11.5 | 5.5 | OK | +109.1% |

**Pontos do tampo (t_mín estimada = 4.6 mm):**

| Ponto | t_atual | t_mín | Status | Margem % |
|-------|---------|-------|--------|----------|
| P4 | 10.8 | 4.6 | OK | +134.8% |
| P5 | 10.5 | 4.6 | OK | +128.3% |

**Resultado Geral:** TODOS OS PONTOS = **OK**

---

### 5.4 PMTA (MAWP) — Casco Cilíndrico (Verificação)

**Dados atuais:**
- t_atual (menor casco): 11.5 mm
- Ca: 3.0 mm (aço carbono + hidrocarbonetos)
- t_efetiva = 11.5 - 3.0 = 8.5 mm
- R_interno = 500 mm (D=1000mm)
- S (SA-516 Gr.70 a 120°C): 133 MPa (tabela ASME II-D)
- E = 1.0

**Fórmula ASME VIII-1 UG-27(c)(1):**
P = (S × E × t) / (R + 0.6 × t)

**Cálculo:**
P = (133 × 1.0 × 8.5) / (500 + 0.6 × 8.5)
P = 1130.5 / 505.1 = 2.238 MPa = **22.38 bar**

**Comparação:**
- PMTA calculada: 22.38 bar
- PMTA de projeto: 25.0 bar
- Pressão de operação: 20.0 bar
- **MAWP > P_operacao** ✓ (22.38 > 20.0)

---

### 5.5 Próxima Inspeção Recomendada

**Intervalo padrão (Vaso Pressão, Risco 2):** 24 meses  
**Com base na taxa de corrosão:** Vida remanescente 37.6 anos → intervalo conservador 24 meses  
**Data recomendada:** 15/01/2026

---

## 6. RESULTADO ESPERADO DO SISTEMA

### JSON de Entrada (CalculationInput)
```json
{
  "equipment": {
    "id": "eq-001",
    "tag": "V-101",
    "type": "VASO_DE_PRESSAO",
    "designPressureBar": 25.0,
    "originalThicknessMm": 12.0,
    "minThicknessMm": 5.5,
    "designTempC": 120,
    "operatingPressureBar": 20.0,
    "operatingTempC": 85,
    "mawpBar": 25.0,
    "hydroTestPressureBar": 37.5,
    "headType": "Semielíptico",
    "bodyMaterial": "SA-516 Gr.70",
    "headMaterial": "SA-516 Gr.70",
    "volumeLiters": 5000,
    "jointEfficiency": 1.0,
    "corrosionAllowanceMm": 3.0,
    "fluidType": "Gás Natural / Óleo",
    "fluidClass": "A",
    "riskGroup": 2,
    "nr13Category": "II"
  },
  "inspection": {
    "id": "insp-001",
    "equipmentId": "eq-001",
    "type": "PERIODICA",
    "status": "APROVADA",
    "startedAt": "2024-01-15T00:00:00Z",
    "completedAt": "2024-01-15T00:00:00Z"
  },
  "measurements": [
    { "point": "P1", "thicknessMm": 11.8, "angleDeg": 0, "notes": "Casco - região superior" },
    { "point": "P2", "thicknessMm": 12.1, "angleDeg": 45, "notes": "Casco - região média" },
    { "point": "P3", "thicknessMm": 11.5, "angleDeg": 90, "notes": "Casco - região inferior" },
    { "point": "P4", "thicknessMm": 10.8, "angleDeg": 0, "notes": "Tampo superior" },
    { "point": "P5", "thicknessMm": 10.5, "angleDeg": 0, "notes": "Tampo inferior" }
  ],
  "previousInspectionDate": "2021-01-15T00:00:00Z",
  "previousMinThicknessMm": 11.9
}
```

### JSON de Saída Esperada (IntegrityAnalysis)
```json
{
  "equipmentId": "eq-001",
  "inspectionId": "insp-001",
  "analyzedAt": "2024-01-20T10:00:00Z",
  "minimumThickness": {
    "value": { "minimumThicknessMm": 5.5, "components": { "pressureComponentMm": 2.5, "corrosionAllowanceMm": 3.0, "totalMm": 5.5 } },
    "unit": "mm",
    "status": "SUCCESS",
    "criticality": "LOW",
    "explanation": "Espessura mínima calculada conforme ASME VIII-1 UG-27",
    "normativeReference": "ASME VIII-1 UG-27 / NR-13 13.5.2",
    "reliability": "HIGH"
  },
  "corrosionRate": {
    "value": { "corrosionRateMmPerYear": 0.133, "corrosionRateMpy": 5.24, "confidence": "MEDIUM", "dataPoints": 2, "trend": "INCREASING" },
    "unit": "mm/ano",
    "status": "SUCCESS",
    "criticality": "LOW",
    "explanation": "Taxa calculada entre inspeções 2021 e 2024",
    "normativeReference": "API 570 7.2 / API 510 6.2",
    "reliability": "MEDIUM"
  },
  "remainingLife": {
    "value": { "remainingLifeYears": 37.6, "remainingLifeMonths": 451, "thicknessMarginMm": 5.0, "recommendedInspectionIntervalMonths": 24 },
    "unit": "anos",
    "status": "SUCCESS",
    "criticality": "LOW",
    "explanation": "Vida útil estimada em 37.6 anos com margem de 1mm",
    "normativeReference": "API 570 7.4 / NR-13 13.7",
    "reliability": "MEDIUM"
  },
  "mawp": {
    "value": { "mawpBar": 22.38, "mawpMpa": 2.238, "governingThicknessMm": 8.5 },
    "unit": "bar",
    "status": "SUCCESS",
    "criticality": "LOW",
    "explanation": "PMTA baseada na espessura atual do casco (elemento governante)",
    "normativeReference": "ASME VIII-1 UG-27 invertido",
    "reliability": "HIGH"
  },
  "overallStatus": "INTEGRO",
  "overallCriticality": "LOW",
  "recommendations": [
    "Equipamento íntegro - Continuar inspeções periódicas conforme cronograma",
    "Manter registros de medições para cálculo de taxa de corrosão",
    "Próxima inspeção recomendada para Janeiro/2026"
  ],
  "riskFactors": []
}
```

---

## 7. OBSERVAÇÕES PARA VALIDAÇÃO

1. **Taxa de corrosão** calculada com apenas 2 pontos (2021 e 2024) — confiança MÉDIA. Recomenda-se 3+ inspeções para regressão linear.

2. **Espessura mínima do tampo** não informada no projeto — estimada como 80% da espessura do casco (4.6 mm). Engenheiro deve confirmar.

3. **PMTA calculada (22.38 bar)** é menor que PMTA de projeto (25 bar) mas ainda maior que pressão de operação (20 bar). Margem de 12% — aceitável mas monitorar.

4. **Material SA-516 Gr.70** — tensões admissíveis interpoladas da tabela ASME II Part D. Verificar edição da norma usada.

5. **Eficiência de junta E=1.0** assume radiografia 100% das juntas longitudinais. Confirmar se foi feito.

---

**Engenheiro Responsável:** _________________________  
**Data da Validação:** _________________________  
**Assinatura:** _________________________