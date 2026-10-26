# LOTE F1c — Fechamento e prova do F1

Data da execução: 26/10/2026

## Caso 0,308 mm/ano

- **Esperado:** `0,308 mm/ano`.
- **Arquivo de origem:** `tests/qa/fixtures/lote21b-report.ts:155`.
- **Origem identificada:** fixture antiga do cenário Lote 21B, espelhando um laudo hipotético/validado; não é o resultado da execução HTTP atual e não é o caso V-101.
- **Caso V-101:** os exemplos V-101 do repositório registram outros valores, como `0,133 mm/ano` em `docs/examples/V-101_Petrobras_VasoPressao.md:216`.
- **Retorno da execução integrada:** `0,306 mm/ano`, encontrado no PDF `qa/lote21b/laudo-text.txt` e produzido pelo equipamento `QA-VP-21B-API` com as medições do seed QA.
- **Decisão:** o valor `0,308` fica como `TODO` de validação, sem alteração da fórmula. A referência obrigatória para decisão é `docs/ENGINEERING_FORMULAS.md`.

O laudo atual permanece marcado como estimativa/THEORETICAL quando aplicável. A tentativa de PDF definitivo sem `mode=demo` retorna `409` com `code=EMISSION_BLOCKED_UNVALIDATED_ENGINEERING` (T13e).

## Jornada local

| Etapa | Tela | API | Persistência | Motor real | Status |
|---|---|---|---|---|---|
| Login Master/Funcionário/Gestor | `/login` | `POST /api/auth/login` | sessão interna assinada | — | funciona |
| Cliente | `/clientes` | `POST /api/clientes` | cliente no PostgreSQL QA | — | funciona |
| Equipamento | `/equipamentos` | `POST /api/equipamentos` | ficha técnica vinculada ao cliente | — | funciona |
| Inspeção | `/inspecoes` | `POST /api/inspections` | inspeção e medições | — | funciona |
| Aprovação | `/inspecoes/[id]` | `PUT /api/inspections/[id]` | status `APROVADA` | — | funciona |
| Cálculo | `/laudos` | `POST /api/reports/pipeline` | `TechnicalReport` | equipamento e medições reais | funciona |
| Prévia/PDF demo | `/reports/[id]` | `GET /api/reports/[id]/pdf?mode=demo` | PDF gerado | resultados marcados | funciona |
| PDF definitivo | `/reports/[id]` | `GET /api/reports/[id]/pdf` | não emite | fórmulas não validadas | bloqueado de propósito |
| Portal Cliente A/B | `/portal` | `GET /api/portal/*` | sessão escopada por cliente | — | funciona; cruzamento retorna `404` |
| Fórmula `0,308` | — | — | fixture antiga | pendente Edison | bloqueado de propósito |

## Evidências

- `qa/lote21b/integration-results.json`: execução HTTP completa, incluindo isolamento A/B, autorização e T13e.
- `qa/lote21b/laudo-text.txt`: texto extraído do PDF demo.
- `docs/demo/f1c/`: diretório reservado para capturas Playwright dos papéis Master, Funcionário, Gestor e Portal. A execução visual não foi gerada neste ambiente porque o sandbox bloqueou o spawn do PostgreSQL embutido, do runner Node e do navegador.

## Continua quebrado ou pendente

- O teste legado T13b não transforma `0,308` em critério aprovado: ele fica `TODO` porque o valor pertence à fixture antiga e diverge do retorno atual `0,306`.
- As fórmulas NR-13/ASME/API continuam sem validação formal do Edison; emissão definitiva segue bloqueada.
- Preview remoto depende de o push concluir o deploy; produção não foi acessada nem alterada.
