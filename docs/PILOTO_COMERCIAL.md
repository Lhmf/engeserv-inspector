# PILOTO_COMERCIAL.md — EngeServ Inspector: kit do primeiro piloto

> Agente C — 19/10/2026. Documento sócio-comercial, baseado **exclusivamente** em
> funcionalidades presentes no código atual e nos documentos do projeto
> (PROJECT_RULES, ROADMAP, TODO, CHANGELOG, SECURITY_PORTAL, NR13_BUSINESS_RULES).
> Nenhuma funcionaidade futura é anunciada como pronta. Sem credenciais, segredos
> ou dados pessoais de clientes reais. Todos os dados numéricos usados em roteiro
> são **explicitamente de demonstração**.

---

## 1. Problema que o produto resolve

Empresas de inspeção NR-13 e manutenção industrial vivem um ciclo manual e
vulnerável a erro:

- **Coleta em papel/célula digitada**: medições de ultrassom, fotos de campo e
  observações ficam dispersas (planilhas, WhatsApp prints pastas locais), sem
  vínculo auditável com o equipamento.
- **Conformidade frágil**: o histórico por equipamento (espessuras, corrosão,
  laudos vigentes/vencidos) exige caça manual; o vencimento de laudo surpreende
  o cliente e o próprio inspetor.
- **Laudo lento e inconsistente**: montar o documento técnico a partir de campos
  avulsos demora e favorece divergência entre o laudo e o que foi medido em campo
  (viola a regra do projeto: *todo documento é gerado a partir do banco de dados*).
- **Cliente no escuro**: o dono do ativo não tem visibilidade de validade,
  recomendações e documentos — o atendimento termina quando a gestão interna fecha.

O EngeServ Inspector organiza esse ciclo em um único fluxo auditável:
**cadastro → inspeção guiada em campo (PWA) → aprovação técnica → consulta pelo
cliente com segurança**, com os requisitos NR-13 interpretados pelo próprio produto
(dashboard de validades, calendário, templates de recomendação).

## 2. Perfil de cliente ideal (primeiro piloto)

- **Empresa de inspeção/apoiamento NR-13 pequena-média** (2 a 10 técnicos de campo,
  1 a 2 gestores técnicos responsáveis) — o produto já suporta os três papéis
  (ADMIN_MASTER, GESTOR, FUNCIONARIO) e até 5 usuários simultâneos por regra do MVP.
- Possui ~10–100 equipamentos sob contrato (vasos de pressão, trocadores, calandras,
  fornos/tubos — tipos já suportados no cadastro).
- Faz **medidas manuais de ultrassom** hoje (a integração com robô de medição é
  desenvolvimento futuro e NÃO faz parte do piloto).
- Tem um **cliente final industrial** disposto a ser o cliente-piloto do Portal
  (idealmente 1 frentes/sites, 5–20 equipamentos).
- Dor de adequação documental: deseja laudo rastreável e válido na visita do
  SESMT/CGS do cliente final.

## 3. Funcionalidades realmente existentes (verificadas no código)

### Sistema interno (a EngeServ usa)
- **Autenticação e permissões reais**: login/logout com sessão assinada (HS256),
  três papéis, regras *Funcionário executa / Gestor e Admin aprovam* (Sprints 1–3 +
  `src/lib/auth.ts`).
- **Cadastro completo**: clientes (com responsável técnico), equipamentos NR-13 com
  dados de projeto (pressão de projeto/operação, MAWP, espessuras, material, fluido,
  grupo de risco, categoria NR-13, ano de fabricação), frentes/sites do cliente.
- **Wizard de inspeção em 5 passos** (`/inspecoes/[id]/wizard`): informações,
  **fotos categorizadas NR-13 (9 categorias)** com câmera in-app e compressão
  automática, **grade de medições por ultrassom** com status OK/Atenção/Crítico,
  observações/recomendações com templates, revisão e "Enviar para Aprovação".
- **Fluxo de aprovação** com estados reais: `EM_ANDAMENTO → AGUARDANDO_APROVACAO →
  APROVADA/REJEITADA` e linha do tempo por inspeção
  (abas: Visão Geral, Fotos, Medições, Timeline).
- **Motor de engenharia (infraestrutura)**: módulo isolado de cálculo com validação
  de dados/unidades robusta (ASME/API referenciados) — **fórmulas em placeholder
  aguardando validação do engenheiro responsável** (não usar como prova técnica);
  Engineering Studio (`/engineering`) demonstra o fluxo com **casos de exemplo
  identificados como demonstração** nas próprias telas ("Internal Tool", v0.1.0-alpha).
- **Pipeline de laudo**: geração de `TechnicalReport` a partir da inspeção
  aprovada (`/api/reports/pipeline`), com workspace de laudo `/reports/[id]` e
  listagem `/laudos` — documento deriva do banco.
- **Validades**: dashboard, calendário e alertas com janelas 90/60/30 dias;
  `periodicityMonths` deriva de decisão do engenheiro no equipamento (não automática).
- **PWA de campo**: installável, dark mode, responsivo (tabelas → cards no mobile),
  storage em Vercel Blob; **fila offline** básica (offline sync completo é fase 2).

### Portal do Cliente (o cliente final usa)
- Login próprio (primeiro nome + 6 dígitos do CNPJ) com cookie httpOnly
  `portal_session` de 30 dias.
- Dashboard do cliente com KPIs reais (equipamentos, regulares/atenção/vencidos,
  laudos disponíveis), equipamentos com validade e última inspeção **aprovada**,
  detalhe com histórico de inspeções, **laudos (apenas APPROVED/PUBLISHED)**,
  documentos do cliente, frentes, calendário de vencimentos e recomendações.
- Sessões com issuer/audience exclusivos, estados ocultos por política
  (`portal-visible-states`), isolamento por `session.clientId` em todas as rotas
  (verificação estática + testes unitários; **prova HTTP multi-cliente ainda
  pendente**, ver §4).

## 4. Limitações conhecidas (honestas, para a conversa comercial)

1. **Cálculos NR-13 com fórmulas placeholder** — o motor valida dados/unidades mas
   os valores finais (espessura mínima, taxa de corrosão, vida remanescente, MAWP)
   aguardam ratificação do engenheiro responsável. O piloto pode rodar o ciclo
   completo, mas o valor técnico nominal depende dessa validação.
2. **Exportação PDF/Word do laudo** — listada como melhoria futura pendente no
   ROADMAP/TODO; no piloto o laudo é consultado no workspace web (`/reports/[id]`).
3. **Credencial inicial do portal fraca por design** (nome + 6 dígitos do CNPJ),
   **sem rate limit** — mitigação em avaliação (exige decisão: serviço de rate externo
   ou migration). Troca obrigatória do fluxo de credencial em processo comercial.
4. **Isolamento multi-cliente sem prova HTTP** — mecanismo implementado
   (estático + unitário), teste de ponta a ponta pendente por falta de banco de teste.
5. **Revogação de sessão inexistente** (logout só apaga cookie; token vale até expirar).
6. **Periodicidade de validade fixa em 12 meses no portal** — validação NR-13 por
   categoria pendente (decisão de negócio).
7. **Offline é parcial** (fila básica; modo offline completo é fase 2).
8. **Requisitos de infra da primeira implantação**: PostgreSQL provisionado e
   `AUTH_SECRET` forte; **`/api/admin/seed` e `/api/admin/create-user` são públicas
   no middleware pós-deploy — desativar/guardar em produção** (item de configuração).
9. `src/portal/app|api` é árvore zombie (não roteável) — limpeza pendente (cosmético,
   não afeta o produto).

## 5. Roteiro de demonstração (12–15 min)

> Ambiente: localhost ou URL de teste com **dados de demonstração previamente
> inseridos e identificados como demo** (ex.: "Indústria Demonstração Ltda",
> CNPJ 00.000.000/0001-00-fictício). Nada de dados de clientes reais.

| # | Minuto | O que mostrar | Onde | Fala-chave |
|---|---|---|---|---|
| 1 | 0–2 | **Problemática hoje**: papel/WhatsApp, laudo lento, cliente no escuro | — (slide ou conversa) | "O ciclo técnico hoje vive espalhado; a norma cobra rastreabilidade." |
| 2 | 2–3 | **Dashboard interno** com KPIs reais do demo (clientes, equipamentos, inspeções, laudos) | `/dashboard` | "Uma única fonte de verdade." |
| 3 | 3–5 | **Novo equipamento NR-13** (dados de projeto: pressões, espessuras, categoria, grupo de risco) e nova inspeção | `/equipamentos/novo`, `/inspecoes/novo` | "Todo dado de norma tem lugar certo, no cadastro — não no laudo avulso." |
| 4 | 5–8 | **Wizard em campo (PWA)**: fotos categorizadas, medições de ultrassom com status, templates de recomendação, revisão e envio | `/inspecoes/[id]/wizard` | "O técnico em campo entrega pronto para o gestor — no celular, offline-friendly." |
| 5 | 8–10 | **Aprovação pelo Gestor** + linha do tempo; **pipeline gera o laudo** a partir do banco; consulta no workspace do laudo | inspeção aprovada → `/api/reports/pipeline` → `/reports/[id]` | "Documento nasce do banco, com trilha de auditoria — rascunho/rejeitado nunca aparece para o cliente." |
| 6 | 10–13 | **Portal do cliente**: login próprio, dashboard de validade, equipamentos com alerta de vencimento, laudo visível, documentos, recomendações | `/portal/login` → portal | "Seu cliente vê o que está em dia, o que vence e o que fazer — sem ligação para sua equipe." |
| 7 | 13–15 | **Segurança & próximos passos**: sessões separadas interno/portal, estados ocultos, o que falta validar (fórmulas com engenheiro, PDF/Word, rate limit) | conversa | "Piloto controlado de 30 dias; validação técnica com seu engenheiro responsável." |

**Não demonstrar** (futuro): assinatura digital, mapa desenrolado, robô de ultrassom,
multi-tenant SaaS, offline completo, exportação PDF/Word (estar em roadmap,
apresentar como roadmap, não como produto).

## 6. Fluxo de trabalho completo (cadastro → consulta do laudo)

1. **Cadastrar cliente** (razão social, CNPJ, contato/responsável técnico, frentes).
2. **Cadastrar equipamento** vinculado ao cliente com dados de projeto NR-13 e
   `periodicityMonths` (decisão do engenheiro).
3. **Funcionário cria inspeção** para o equipamento e executa o wizard:
   fotos → medições → observações → revisão → "Enviar para Aprovação".
4. **Gestor revisa** na página da inspeção: aprova ou rejeita (com motivo).
5. Com a inspeção **APROVADA**, o pipeline gera o **laudo técnico**
   (`TechnicalReport`) e fica disponível em `/reports/[id]` (estados: DRAFT →
   UNDER_REVIEW → APPROVED/PUBLISHED, conforme governança interna).
6. **Cliente final acessa o Portal** (primeiro nome + 6 dígitos do CNPJ):
   vê equipamentos/validades, laço APPROVED/PUBLISHED, documentos, frentes e
   recomendações — **nunca** rascunhos ou inspeções em andamento.
7. **Alertas de validade** no calendário interno (90/60/30 dias) guiaram a próxima
   inspeção.

## 7. Checklist de preparação para a primeira demonstração

### ✅ Já pronto (o que dá para demonstrar hoje em ambiente configurado)
- Sistema interno completo: login/permissões, cadastros, wizard, aprovação, pipeline de laudo, workspace de laudo, validades, Engineering Studio (dados de demo).
- Portal do cliente completo: login, dashboard, equipamentos, laudos, documentos, frentes, calendário, recomendações, logout.
- PWA instalável com dark mode e responsividade; fluxo de fotos com câmera.
- Segurança de sessão (claims exclusivos), estados ocultos do portal.

### 🔧 Depende de infraestrutura/configuração (imediato, sem desenvolvimento)
- [ ] **Banco PostgreSQL real provisionado** (o ambiente atual não tem banco acessível — demo local exige LOCAL: container/nuvem com migração aplicada).
- [ ] `AUTH_SECRET` forte gerado; `_MANAGEMENT_CODE` usado **apenas no seed** e rotacionado/ocultado após.
- [ ] **Desativar/guardar `/api/admin/seed` e `/api/admin/create-user` em produção** (estão em PUBLIC_PATHS do middleware).
- [ ] Configurar **Vercel Blob** (variável de ambiente de storage) para fotos.
- [ ] Deploy (Vercel configurada no projeto) OU máquina de demo permanente.
- [ ] PWA instalado no celular/tablet de demonstração (ícones/manifest já prontos).

### 📦 Depende de dados de teste (gerar por script autorizado, nunca "handmade" durante demo)
- [ ] Cliente-demo ("Indústria Demonstração LTDA", CNPJ fictício), 2 frentes, 3–5 equipamentos NR-13 com dados plausíveis **explicitamente de demo**;
- [ ] 1 inspeção `EM_ANDAMENTO` (para alimentar o wizard ao vivo), 1 inspeção `APROVADA` com laudo visível, 1 laudo/inspeção em DRAFT **invisível no portal** (mostrar a política);
- [ ] 1 documento de cliente + recomendações;
- [ ] contas: 1 ADMIN_MASTER, 1 GESTOR, 1 FUNCIONARIO; anotar credenciais demo em cofre (não no documento).

### 🚧 Depende de desenvolvimento/decisão (antecipar na conversa)
- [ ] **Validação das fórmulas do motor pelo engenheiro responsável** (bloqueador de valor técnico nominal);
- [ ] Exportação PDF/Word (roadmap);
- [ ] Rate limit do login do portal + fluxo de troca de credencial inicial;
- [ ] Revogação server-side de sessão (opções documentadas em SECURITY_PORTAL §5);
- [ ] Teste HTTP multi-cliente (protocolo pronto em QA-LOTE-18C) — **critério de entrada do piloto**;
- [ ] Decisão de negócio: visibilidade `ARCHIVED`, notas de inspeções `APROVADA`, periodicidade NR-13 por categoria.

## 8. Informações necessárias para configurar o cliente-piloto

**Da empresa de inspeção (fornecedora):**
1. Razão social, CNPJ, logo (futuro), usuários (1 admin, gestores, técnicos).
2. Responsável técnico com ART (campos existem no fluxo de laudo).
3. Local de deploy preferido (Vercel atual ou servidor próprio).

**Do cliente final (cliente-piloto do portal):**
4. Razão social + CNPJ (define credencial inicial do portal).
5. Nome do contato (primeiro nome) — necessário pelo fluxo de login atual.
6. Lista de frentes/sites (nome, endereço).
7. Lista de equipamentos por frente: tag, tipo, ano, pressões (projeto/operação),
   espessuras (original, mínima, allowance), material, fluido/classe, grupo de risco,
   categoria NR-13, `periodicityMonths` aprovado pelo engenheiro.
8. Documentos iniciais a disponibilizar no portal (contratos de inspeção, ARTs).

**Da operação piloto:**
9. Janela piloto (sugerida: 30 dias), número de inspeções previstas,
   critérios de sucesso (§10) e nome do responsável técnico que ratificará fórmulas.

## 9. Fluxo operacional do piloto (semanas)

- **Semana 0**: infra + seed demo + credenciais + treinamento de 2 horas (gestor/técnico).
- **Semanas 1–2**: uso interno real em 2–3 inspeções por técnico, com acompanhamento;
  ativação do portal do cliente-piloto com 1–2 frentes.
- **Semanas 3–4**: ciclo completo (inspeção → aprovação → laudo → consulta portal)
  sem intervenção; coleta de métricas; reunião de fechamento.

## 10. Critérios objetivos de sucesso do piloto

| Critério | Meta |
|---|---|
| Tempo de registro em campo (fotos+medições+revisão) | reduzir em ≥30% vs. processo atual do piloto (medido nas 2 primeiras vs. 2 últimas inspeções) |
| Ciclo aprovação → laudo disponível | < 24 h em ≥80% das inspeções |
| Uso efetivo do portal pelo cliente final | ≥3 acessos do contato do cliente durante o piloto, ao menos 1 consulta de laudo |
| Integridade de dados | 0 laudos divergentes do banco (todo laudo derivado de inspeção aprovada) |
| Segurança | Estados ocultos e escopo de cliente corretos em 100% dos acessos; **teste HTTP de isolamento dois clientes aprovado antes da liberação** (não substituído por análise estática) |
| Confiabilidade do cálculo | ±0 divergência vs. cálculo manual do engenheiro em N casos ratificados (com fórmulas validadas) |

## 11. Próximos passos para contratação (após piloto bem-sucedido)

1. Relatório de piloto: métricas §10, obstáculos, lista de ajustes solicitados.
2. **Obter validação formal das fórmulas** pelo engenheiro responsável (pré-requisito
   de valor técnico; testes unitários ficam prontos para receber os valores).
3. Proposta comercial com escopo: usuários, equipamentos, portal, suporte;
   roadmap priorizado (PDF/Word, assinatura digital, alertas, robô de medição).
4. Hardening de produção: rate limit + troca de credencial inicial, revogação de
   sessão, monitoramento, política de backup do banco.
5. Expansão do onboarding: migração em massa de equipamentos (importação assistida),
   SLA de suporte, calendário de validades como serviço contínuo.

---
*Documento preparado pelo Agente C a partir do estado real do working tree
(19/10/2026, HEAD a18ec43). A exportação PDF/Word, assinatura digital, robô de
medição, multi-tenant e offline completo constam do ROADMAP como futuras —
não são entram no escopo deste piloto.*
