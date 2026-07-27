# Intervalos de Inspeção e Próxima Inspeção

**Base de Conhecimento — EngeServ Inspector**

---

## Objetivo
Definir regras para cálculo de intervalos de inspeção periódica e extraordinária, data da próxima inspeção, e ajustes baseados em condição (RBI simplificado).

---

## Aplicação
- Agendamento de inspeções periódicas
- Ajuste de intervalo por condição (taxa de corrosão, criticidade)
- Inspeções extraordinárias (pós-reparo, alteração, incidente)
- Dashboard de validades (Sprint 6)

---

## Normas
| Norma | Seção | Uso |
|---|---|---|
| **NR-13** | 13.7, 13.7.2 | Intervalos legais brasileiros |
| **API 510** | 6.3, 6.4 | Vasos de pressão |
| **API 570** | 7.3, 7.4 | Tubulação |
| **API 653** | 6.2 | Tanques atmosféricos |
| **API 581** | — | RBI (referência para ajuste) |

---

## Variáveis

| Símbolo | Descrição | Unidade |
|---|---|---|
| I_padrao | Intervalo padrão por norma/tipo | meses |
| I_ajustado | Intervalo ajustado por condição | meses |
| Vida | Vida útil remanescente | anos |
| CR | Taxa de corrosão | mm/ano |
| t_atual | Espessura mínima atual | mm |
| t_mín | Espessura mínima admissível | mm |
| Data_Ultima | Data da última inspeção | Date |
| Data_Proxima | Data calculada próxima inspeção | Date |
| Fator_Risco | Fator de ajuste (RBI simplificado) | adimensional |

---

## Intervalos Padrão (I_padrao) — Meses

### NR-13 (Mínimos Legais)
| Tipo | Intervalo | Observação |
|---|---|---|
| Caldeira | 12 | Anual obrigatório |
| Vaso de Pressão | 24 a 48 | Conforme categoria risco |
| Tanque Atmosférico | 60 | 5 anos |
| Tubulação | 24 a 48 | Conforme fluido/risco |
| Silo | 24 | - |

### API 510 (Vasos de Pressão)
| Condição | Intervalo Máximo |
|---|---|
| CR ≤ 0.1 mm/a, Vida > 10 anos | 10 anos (120 meses) |
| CR ≤ 0.1 mm/a, Vida 5-10 anos | 5 anos (60 meses) |
| CR > 0.1 mm/a ou Vida < 5 anos | Vida/2 (máx 5 anos) |
| Sem dados de corrosão | 5 anos (conservador) |

### API 570 (Tubulação)
| Classe | Intervalo Máximo |
|---|---|
| Classe 1 (Alto risco) | 5 anos |
| Classe 2 (Médio risco) | 10 anos |
| Classe 3 (Baixo risco) | 10 anos |
| Com RBI | Conforme análise |

### API 653 (Tanques Atmosféricos)
| Tipo Inspeção | Intervalo |
|---|---|
| Externa (Visual) | 5 anos |
| Interna (Fundo/Anéis) | 10-20 anos (conforme fundo) |
| Fundo (MFL/Ultrassom) | 5-10 anos |

---

## Ajuste por Condição (I_ajustado)

### Fatores de Redução
| Condição | Fator Redução | Novo Intervalo |
|---|---|---|
| CR > 1.0 mm/a | 0.25 | I_padrao × 0.25 (mín 6 meses) |
| CR 0.5 – 1.0 mm/a | 0.5 | I_padrao × 0.5 |
| CR 0.1 – 0.5 mm/a | 0.75 | I_padrao × 0.75 |
| CR ≤ 0.1 mm/a | 1.0 | I_padrao (padrão) |
| Equipamento CRÍTICO (t ≤ t_mín) | 0 | **Inspeção IMEDIATA** |
| Equipamento ATENÇÃO (t ≤ 1.2×t_mín) | 0.5 | I_padrao × 0.5 |
| Reparo/Alteração recente | 0.5 | I_padrao × 0.5 (primeira inspeção) |
| Mudança fluido/condição operação | 0.5 | I_padrao × 0.5 |
| RBI Simplificado) | 1.0 - (Risco_Relativo × 0.5) | I_padrao × Fator |

---

## Cálculo da Próxima Inspeção

### Fórmula Base
```
Data_Proxima = Data_Ultima + I_ajustado (em meses)
```

### Com Vida Útil
```
I_ajustado = min( I_padrao × Fator_Condição , Vida_Remanescente/2 × 12 )
```

### Regras de Negócio EngeServ
1. **Mínimo absoluto:** 6 meses (exceto caldeira = 12)
2. **Máximo absoluto:** I_padrao da norma
3. **Arredondamento:** Para mês inteiro (teto)
4. **Feriados/Finais de semana:** Próximo dia útil
5. **Aviso antecedência:** 30 dias antes (dashboard Sprint 6)

---

## Inspeções Extraordinárias

| Tipo | Gatilho | Intervalo |
|---|---|---|
| **Pós-Reparo** | Solda, pad, substituição peça | 6 meses após reparo |
| **Pós-Alteração** | Mudança fluido, pressão, temperatura | 12 meses |
| **Pós-Incidente** | Vazamento, sobrepressão, incêndio | Imediata + 6 meses |
| **Mudança Condição** | Novo fluido, P/T alterados | 12 meses |
| **Descomissionamento** | Retorno à operação | Antes do retorno |

---

## Fluxograma: Cálculo Próxima Inspeção

```
INÍCIO: Equipamento com última inspeção
  │
  ▼
Obter: Tipo, Última_Data, CR, t_atual, t_mín, Categoria_Risco
  │
  ▼
Buscar I_padrao por Tipo + Categoria (Tabela Norma)
  │
  ▼
Calcular Fator_Condição:
  │
  ├─ Se t_atual ≤ t_mín → Fator = 0 (INSPEÇÃO IMEDIATA)
  │
  ├─ Se t_atual ≤ 1.2 × t_mín → Fator = 0.5
  │
  ├─ Se CR > 1.0 → Fator = 0.25
  │
  ├─ Se CR 0.5-1.0 → Fator = 0.5
  │
  ├─ Se CR 0.1-0.5 → Fator = 0.75
  │
  ├─ Se CR ≤ 0.1 → Fator = 1.0
  │
  ├─ Se Reparo/Alteração/Incidente recentes → Fator = min(Fator, 0.5)
  │
  ▼
I_ajustado = I_padrao × Fator_Condição
  │
  ▼
Se CR > 0:
  Vida = (t_atual - t_mín - 1.0) / CR
  I_vida = Vida/2 × 12
  I_ajustado = min(I_ajustado, I_vida)
  │
  ▼
Aplicar limites: max(6, min(I_ajustado, I_padrao))
  │
  ▼
Data_Proxima = Última_Data + I_ajustado (meses)
  │
  ▼
Arredondar para mês inteiro (teto)
  │
  ▼
Se Data_Proxima < Hoje → ATRASADA (flag vermelho)
  │
  ▼
FIM: Retornar Data_Proxima, I_ajustado, Status
```

---

## Exemplos

### Exemplo 1: Vaso Padrão (Baixa Corrosão)
- Tipo: Vaso Pressão, Cat. II
- Última: 15/01/2024
- CR: 0.08 mm/a (BAIXA)
- t_atual: 11.5mm, t_mín: 5.5mm
- I_padrao (API 510): 120 meses (10 anos)
- Fator: 1.0 (CR ≤ 0.1)
- I_ajustado: 120 meses
- **Próxima: 15/01/2034**

### Exemplo 2: Vaso Corrosão Moderada
- Tipo: Vaso Pressão
- Última: 15/06/2023
- CR: 0.3 mm/a (MODERADA)
- I_padrao: 60 meses (5 anos - vida < 10a)
- Fator: 0.75
- I_ajustado: 45 meses
- **Próxima: 15/03/2027**

### Exemplo 3: Equipamento em Atenção
- t_atual: 6.2mm, t_mín: 5.5mm (6.2 ≤ 1.2×5.5 = 6.6)
- CR: 0.4 mm/a
- I_padrao: 24 meses
- Fator: 0.5 (atenção) × 0.75 (CR) = 0.375
- I_ajustado: 9 meses
- **Próxima: 9 meses após última**

### Exemplo 4: Equipamento Crítico
- t_atual: 5.2mm, t_mín: 5.5mm
- **Fator = 0**
- **Status: INSPEÇÃO IMEDIATA / PARADA**

---

## Dashboard de Validades (Sprint 6)

### Status por Equipamento
| Status | Critério | Cor | Ação |
|---|---|---|---|
| **OK** | Data_Proxima > +90 dias | 🟢 | Monitorar |
| **AVISO** | +30 < Data_Proxima ≤ +90 | 🟡 | Planejar |
| **URGENTE** | 0 < Data_Proxima ≤ +30 | 🟠 | Agendar já |
| **ATRASADO** | Data_Proxima ≤ Hoje | 🔴 | Ação IMEDIATA |
| **CRÍTICO** | t_atual ≤ t_mín | 🔴🔴 | PARAR EQUIPAMENTO |

### Filtros Dashboard
- Por Cliente
- Por Tipo Equipamento
- Por Status (OK/Aviso/Urgente/Atrasado/Crítico)
- Por Mês/Ano (Calendário)
- Por Responsável Técnico

---

## Status de Implementação

| Funcionalidade | Status | Arquivo |
|---|---|---|
| Intervalos padrão por norma | [x] Constantes | `constants/index.ts` |
| Fator condição (CR, espessura) | [x] Domain | `domain/entities.ts` |
| Cálculo próxima data | [ ] Pendente | `services/engine.ts` |
| Ajuste por vida útil | [ ] Pendente | `services/engine.ts` |
| Inspeções extraordinárias | [ ] Pendente | `application/use-cases.ts` |
| Dashboard validades | [ ] Sprint 6 | `app/(app)/validades/` |

---

**Última atualização:** 21/07/2026  
**Responsável:** Engenheiro Responsável EngeServ  
**Próxima revisão:** Sprint 5/6