# CHANGELOG.md

Todas as entregas do projeto, em ordem cronol�gica. Atualize a cada sess�o de trabalho conclu�da.

## 26/09/2026 � Lote 8 � Robustez do banco de dados e integridade do Portal do Cliente

**Decis�o aprovada pelo usu�rio:** melhorar a robustez do banco de dados e a integridade dos dados do Portal do Cliente, adicionando �ndices para melhorar o desempenho das consultas comuns e garantir a integridade dos dados.

### Implementa��o

- prisma/schema.prisma: adicionado �ndice [clientId, active] ao modelo Equipment para melhorar o desempenho das consultas que filtram por cliente e status ativo.
- prisma/schema.prisma: adicionado �ndice [clientId, active] ao modelo ClientSite para melhorar o desempenho das consultas que filtram por cliente e status ativo.

### Testes executados

- 
px tsc --noEmit ? 0 erros
- 
pm run build ? sucesso (61/61 rotas geradas, Middleware 32.6 kB)

### Limita��es registradas

- Teste de isolamento entre clientes reais: **pendente** (banco dummy offline).
- Auditoria visual completa: **pendente** (requer navegador dispon�vel).

## 26/09/2026 � Lote 8 � Robustez do banco de dados e integridade do Portal do Cliente

**Decis�o aprovada pelo usu�rio:** melhorar a robustez do banco de dados e a integridade dos dados do Portal do Cliente, adicionando �ndices para melhorar o desempenho das consultas comuns e garantir a integridade dos dados.

### Implementa��o

- prisma/schema.prisma: adicionado �ndice [clientId, active] ao modelo Equipment para melhorar o desempenho das consultas que filtram por cliente e status ativo.
- prisma/schema.prisma: adicionado �ndice [clientId, active] ao modelo ClientSite para melhorar o desempenho das consultas que filtram por cliente e status ativo.

### Testes executados

- 
px tsc --noEmit ? 0 erros
- 
pm run build ? sucesso (61/61 rotas geradas, Middleware 32.6 kB)

### Limita��es registradas

- Teste de isolamento entre clientes reais: **pendente** (banco dummy offline).
- Auditoria visual completa: **pendente** (requer navegador dispon�vel).





## 26/09/2026 — Lote 9 — Evolução do Portal do Cliente para um produto B2B premium

**Decisão aprovada pelo usuário:** transformar o Portal do Cliente em um produto profissional que a EngeServ possa apresentar a clientes industriais, transmitindo organização, confiabilidade, rastreabilidade e controle dos equipamentos e serviços.

### Implementação
- src/app/(app)/dashboard/page.tsx: reformulado o dashboard para exibir indicadores reais baseados nos dados do cliente autenticado, incluindo:
  - Total de equipamentos cadastrados.
  - Equipamentos regulares (espessura OK).
  - Equipamentos que exigem atenção (espessura em atenção).
  - Equipamentos vencidos (espessura crítica).
  - Laudos disponíveis (contagem de inspeções aprovadas).
  - Contagem de inspeções no período (aprovadas e pendentes).
  - Contagem de ações pendentes (inspeções pendentes + equipamentos em atenção + equipamentos vencidos).
  - Contagem de atividades futuras (inspeções em progresso ou aguardando aprovação).
- src/app/(app)/dashboard/DashboardClient.tsx: atualizado o componente do cliente para receber os novos indicadores e redesenhar a grade de KPIs principal para exibir sete cards:
  - Clientes Ativos
  - Equipamentos Total
  - Equipamentos Regulares
  - Equipamentos Atenção
  - Equipamentos Vencidos
  - Inspeções no Período
  - Laudos
- Mantidos os existentes gráficos de inspeções por status e dados mensais.
- Mantidos os existentes tipos de equipamentos.
- Atualizados os textos e legendas para refletir os novos indicadores.

### Testes executados
- npx tsc --noEmit → 0 erros
- npm run build → sucesso (61/61 rotas geradas, Middleware 32.6 kB)

### Limitações registradas
- Teste de isolamento entre clientes reais: pendente (banco dummy offline).
- Auditoria visual completa: pendente (requer navegador disponível).
