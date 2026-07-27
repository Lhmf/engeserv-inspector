# Materiais de Referência — Tensões Admissíveis

**Base de Conhecimento — EngeServ Inspector**

---

## Objetivo
Centralizar tensões admissíveis (S) por material, grau e temperatura para uso nos cálculos de espessura mínima (t_min) e PMTA (MAWP).

---

## Normas
| Norma | Documento | Uso |
|---|---|---|
| **ASME BPVC Section II Part D** | Tabelas 1A, 1B, 4, 5A, 5B | Tensões admissíveis (S) |
| **ASME BPVC Section VIII-1** | UG-23, UG-24, UG-27 | Regras de uso das tensões |
| **NR-13** | 13.5 | Requisitos legais |
| **ASTM/ASME Specs** | SA-516, SA-515, SA-36, SA-240, etc. | Especificações de material |

---

## Como Usar

1. **Identificar material** pelo Spec/Grade (ex: SA-516 Gr.70)
2. **Encontrar tensão admissível S** à temperatura de projeto
3. **Interpolar linearmente** entre temperaturas tabeladas se necessário
4. **Verificar limites:** temperatura máxima do material, limites de fluência (tempo) se > 400°C

---

## Tabelas de Referência (Valores Aproximados — CONFIRMAR COM ASME II-D VIGENTE)

### Aços Carbono — Placas para Vasos/Caldeiras

#### SA-516 Grade 70 (Mais Comum — Vasos Pressão)
| Temp (°C) | S (MPa) | Notas |
|---|---|---|
| -29 a 38 | 138 | Temperatura ambiente |
| 50 | 138 | |
| 100 | 138 | |
| 150 | 133 | |
| 200 | 125 | |
| 250 | 116 | |
| 300 | 106 | |
| 350 | 98 | |
| 400 | 93 | Limite fluência começa |
| 425 | 90 | |
| 450 | 87 | |
| 475 | 83 | |
| 500 | 77 | |
| 525 | 65 | Acima: regime fluência |
| 538 | 55 | |

#### SA-516 Grade 60
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 117 |
| 100 | 117 |
| 150 | 113 |
| 200 | 106 |
| 250 | 99 |
| 300 | 91 |
| 350 | 84 |
| 400 | 79 |
| 450 | 74 |

#### SA-516 Grade 65
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 131 |
| 100 | 131 |
| 150 | 127 |
| 200 | 119 |
| 250 | 111 |
| 300 | 101 |
| 350 | 93 |
| 400 | 87 |

---

#### SA-515 Grade 70 (Caldeiras — Antigo)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 138 |
| 100 | 138 |
| 150 | 133 |
| 200 | 125 |
| 250 | 116 |
| 300 | 106 |
| 350 | 98 |
| 400 | 93 |

#### SA-515 Grade 60
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 117 |
| 100 | 117 |
| 150 | 113 |
| 200 | 106 |

---

#### SA-36 (Estrutural / Tampões / Tanques API 650)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 115 |
| 50 | 115 |
| 100 | 115 |
| 150 | 112 |
| 200 | 107 |
| 250 | 102 |
| 300 | 96 |
| 350 | 90 |
| 400 | 86 |

---

### Aços Baixa Liga (Cr-Mo) — Alta Temperatura

#### SA-387 Grade 11 Class 2 (1.25Cr-0.5Mo)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 114 |
| 100 | 114 |
| 150 | 114 |
| 200 | 112 |
| 250 | 110 |
| 300 | 107 |
| 350 | 104 |
| 400 | 101 |
| 450 | 96 |
| 500 | 85 |
| 538 | 68 |
| 550 | 58 |

#### SA-387 Grade 22 Class 2 (2.25Cr-1Mo)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 138 |
| 100 | 138 |
| 150 | 138 |
| 200 | 135 |
| 250 | 131 |
| 300 | 127 |
| 350 | 122 |
| 400 | 117 |
| 450 | 110 |
| 500 | 97 |
| 538 | 76 |
| 550 | 64 |

#### SA-387 Grade 5 Class 2 (5Cr-0.5Mo)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 138 |
| 100 | 138 |
| 150 | 138 |
| 200 | 135 |
| 250 | 131 |
| 300 | 127 |
| 350 | 122 |
| 400 | 117 |
| 450 | 110 |
| 500 | 97 |
| 538 | 76 |

---

### Aços Inoxidáveis Austeníticos

#### SA-240 304 / SA-240 304L
| Temp (°C) | S 304 (MPa) | S 304L (MPa) |
|---|---|---|
| -29 a 38 | 138 | 115 |
| 50 | 134 | 112 |
| 100 | 114 | 95 |
| 150 | 103 | 86 |
| 200 | 94 | 79 |
| 250 | 87 | 73 |
| 300 | 82 | 68 |
| 350 | 78 | 64 |
| 400 | 75 | 61 |
| 425 | 73 | 60 |
| 450 | 71 | 59 |
| 500 | 68 | 56 |
| 538 | 64 | 52 |

#### SA-240 316 / SA-240 316L
| Temp (°C) | S 316 (MPa) | S 316L (MPa) |
|---|---|---|
| -29 a 38 | 138 | 115 |
| 50 | 133 | 111 |
| 100 | 114 | 95 |
| 150 | 103 | 86 |
| 200 | 94 | 79 |
| 250 | 87 | 73 |
| 300 | 82 | 68 |
| 350 | 78 | 64 |
| 400 | 75 | 61 |
| 425 | 73 | 60 |
| 450 | 71 | 59 |
| 500 | 68 | 56 |
| 538 | 64 | 52 |

#### SA-240 321 / 347 (Estabilizados Ti/Nb)
| Temp (°C) | S 321 (MPa) | S 347 (MPa) |
|---|---|---|
| -29 a 38 | 138 | 138 |
| 100 | 118 | 118 |
| 150 | 108 | 108 |
| 200 | 98 | 98 |
| 250 | 91 | 91 |
| 300 | 85 | 85 |
| 350 | 80 | 80 |
| 400 | 76 | 76 |
| 425 | 74 | 74 |
| 450 | 72 | 72 |
| 500 | 69 | 69 |

---

### Duplex / Super Duplex

#### SA-240 2205 (Duplex 22%Cr)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 310 |
| 50 | 300 |
| 100 | 270 |
| 150 | 245 |
| 200 | 225 |
| 250 | 210 |
| 300 | 195 |

#### SA-240 2507 (Super Duplex 25%Cr)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 380 |
| 50 | 370 |
| 100 | 340 |
| 150 | 310 |
| 200 | 285 |
| 250 | 265 |
| 300 | 245 |

---

### Ligas de Níquel (Corrosão Severa)

#### SA-400 / SB-127 Monel 400 (Ni-Cu)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 172 |
| 100 | 155 |
| 150 | 145 |
| 200 | 138 |
| 250 | 131 |
| 300 | 124 |
| 350 | 117 |

#### SB-575 Hastelloy C-276 (Ni-Mo-Cr)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 276 |
| 100 | 258 |
| 150 | 245 |
| 200 | 234 |
| 250 | 224 |
| 300 | 214 |
| 350 | 203 |

#### SB-424 Inconel 625 (Ni-Cr-Mo)
| Temp (°C) | S (MPa) |
|---|---|
| -29 a 38 | 414 |
| 100 | 386 |
| 150 | 365 |
| 200 | 352 |
| 250 | 341 |
| 300 | 331 |
| 350 | 321 |

---

## Propriedades Mecânicas de Referência

| Material | Sy (MPa) | Su (MPa) | % Alongamento |
|---|---|---|---|
| SA-516 Gr.70 | 260 | 485 | 21% |
| SA-516 Gr.60 | 220 | 415 | 24% |
| SA-515 Gr.70 | 260 | 485 | 21% |
| SA-36 | 250 | 400 | 23% |
| SA-387 Gr.11 Cl.2 | 220 | 415 | 20% |
| SA-387 Gr.22 Cl.2 | 275 | 515 | 18% |
| SA-240 304/304L | 170/170 | 485/485 | 40%/40% |
| SA-240 316/316L | 170/170 | 485/485 | 40%/40% |
| SA-240 2205 | 450 | 620 | 25% |

---

## Interpolação Linear (Algoritmo)

```typescript
function interpolateStress(temp: number, table: {temp: number, stress: number}[]): number {
  // Ordenar por temperatura
  const sorted = [...table].sort((a, b) => a.temp - b.temp);
  
  // Fora dos limites
  if (temp <= sorted[0].temp) return sorted[0].stress;
  if (temp >= sorted[sorted.length - 1].temp) return sorted[sorted.length - 1].stress;
  
  // Encontrar intervalo
  for (let i = 0; i < sorted.length - 1; i++) {
    if (temp >= sorted[i].temp && temp <= sorted[i + 1].temp) {
      const t1 = sorted[i].temp;
      const t2 = sorted[i + 1].temp;
      const s1 = sorted[i].stress;
      const s2 = sorted[i + 1].stress;
      
      // Interpolação linear
      return s1 + (s2 - s1) * (temp - t1) / (t2 - t1);
    }
  }
  
  return sorted[sorted.length - 1].stress;
}
```

---

## Regras de Aplicação (ASME VIII-1)

| Regra | Descrição |
|---|---|
| **UG-23** | Não usar tensão acima do limite de proporcionalidade |
| **UG-24** | Tensão admissível = menor de: Su/3.5, Sy/1.5, Scr/1.5 (creep) |
| **UG-27** | Espessura mínima com tensão S à temperatura de projeto |
| **UG-20** | Temperatura de projeto ≥ temperatura de operação |
| **UG-21** | Temperatura de projeto ≤ temperatura máxima do material |
| **Note (1) Tabelas** | Valores acima de 400°C podem exigir análise de fluência |

---

## Status de Implementação

| Funcionalidade | Status | Arquivo |
|---|---|---|
| Tabela SA-516 Gr.70 | [x] Constantes | `constants/index.ts` |
| Tabela SA-516 Gr.60 | [x] Constantes | `constants/index.ts` |
| Tabela SA-36 | [x] Constantes | `constants/index.ts` |
| Tabela SA-240 316L | [x] Constantes | `constants/index.ts` |
| Tabela SA-387 Gr.11/22 | [x] Parcial | `constants/index.ts` |
| Interpolação linear | [x] Utils | `utils/units.ts` (adaptar) |
| Busca por material | [x] Constants | `constants/index.ts` |
| Limites temperatura | [ ] Pendente | `validators/index.ts` |

---

**Última atualização:** 21/07/2026  
**Fonte:** ASME BPVC Section II Part D 2021 Edition  
**Responsável:** Engenheiro Responsável EngeServ  
**Observação:** Valores aproximados para referência. **Sempre consultar ASME II-D edição vigente** para cálculos oficiais.