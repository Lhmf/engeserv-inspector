# QA Lote F1d

## Resultado local

Executado com PostgreSQL embutido em `127.0.0.1:55432` e servidor Next local:

- `npx tsc --noEmit`: passou.
- `npx tsx --test tests/qa/regional-adoption.test.ts tests/qa/pdf-emission-barrier.test.ts`: 27 pass, 1 skipped, 0 fail.
- `npx playwright test tests/e2e/f1d-journey.spec.ts --reporter=list`: 3 pass, 0 fail.

O skip é o caso de `0,308 mm/ano`, mantido sem alteração até validação do Edison. A emissão definitiva continua bloqueada para resultado teórico e para adoção regional sem aprovação do responsável técnico.

## Jornada

| Etapa | Tela | API | Persistência | Motor real |
|---|---|---|---|---|
| Login | `/login` | `POST /api/auth/login` | sessão interna | não se aplica |
| Cliente | `/clientes` | `POST /api/clientes` | `Client` | não se aplica |
| Equipamento | `/equipamentos/novo` | `POST /api/equipamentos` | `Equipment` vinculado ao cliente | validação no pipeline |
| Inspeção | `/inspecoes/novo` | `POST /api/inspections` | `Inspection` vinculada ao equipamento | não se aplica |
| Medições | wizard | `POST /api/inspections/:id/measurements/batch` | 9 pontos reais + pontos adotados no cálculo | validação de pontos |
| Laudo | revisão do wizard | `POST /api/reports/pipeline` | `TechnicalReport` versionado | executado |
| Oficial | `/reports/:id` | `GET /api/reports/:id/official-html` | HTML oficial | renderizado |
| PDF | ação de PDF | `GET /api/reports/:id/pdf` | arquivo gerado no servidor | barreira aplicada |
| Portal | `/portal/dashboard` | `POST /api/portal/login` | sessão isolada por `clientId` | isolamento Cliente A/B provado |

## Evidências

As capturas da jornada ficam em `docs/demo/f1d/`. O demonstrativo server-side é `docs/demo/f1d/demo-report.pdf` (28 páginas, gerado pelo mesmo HTML oficial usado na rota PDF).

O modelo oficial usado como referência é `qa/pdf/LAUDO TECNICO DE INSPEÇÃO PERIODICA  PULVERIZADOR PRESSURIZADO COAGRIL 408-1.docx`. A estrutura do HTML agora reproduz a sequência de 28 páginas, cabeçalho repetido, seções NR-13, mapa de 18 pontos, cálculo de vida útil, conclusão, responsabilidade técnica e anexos. Os anexos sem arquivo fornecido aparecem como áreas reservadas; eles ainda precisam receber os certificados reais para equivalência visual total.

## Pendências conhecidas

- Fórmulas de engenharia seguem teóricas até aprovação do Edison.
- Preview depende da configuração de banco remoto (`POSTGRES_URL`) e pode estar protegida por SSO da Vercel.
- O layout HTML oficial está conectado ao renderer PDF; a equivalência pixel a pixel depende do `modelo.pdf` oficial.
