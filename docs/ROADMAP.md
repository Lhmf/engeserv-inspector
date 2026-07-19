# ROADMAP.md

Cada fase deve ser pequena e testável. Marque `[x]` quando concluída e
registre a data em `CHANGELOG.md`.

## Sprint 1 — Estrutura base ✅ (entregue nesta rodada)

- [x] Autenticação de usuários (login/logout via cookie de sessão)
- [x] Layout responsivo com sidebar e topbar
- [x] Dashboard inicial (KPIs reais de clientes/equipamentos/usuários)
- [x] Banco de dados (Prisma + SQLite local) com modelos de User, Client,
      Equipment
- [x] Navegação entre os módulos (placeholders para os módulos futuros)
- [x] Script de seed do primeiro Administrador Master
- [x] Módulo de Usuários funcional (criação de Gestor/Funcionário com
      checagem de permissão)
- [x] Deploy configurado para Vercel + instruções de rodar em localhost
- [ ] Tema claro/escuro (opcional — não incluído nesta rodada)

## Sprint 2 — Cadastro

- [ ] Cadastro completo de Clientes (formulário + listagem + edição)
- [ ] Cadastro completo de Equipamentos (vinculado a um cliente)
- [ ] Cadastro de Responsáveis Técnicos
- [ ] Refinar tela de Usuários (edição, desativação)

## Sprint 3 — Inspeções

- [ ] Cadastro de inspeções vinculadas a um equipamento
- [ ] Upload de fotos (categorizadas: placa, corrosão, válvula, manômetro,
      ultrassom, vista geral, solda, trinca, reparo)
- [ ] Registro de medições (mapa de pontos de ultrassom)
- [ ] Histórico de inspeções por equipamento (linha do tempo)

## Sprint 4 — Motor de cálculos

- [ ] Implementar fórmulas da NR-13 (espessura mínima, pressões,
      corrosão, vida útil, coeficiente de segurança) em módulo isolado
- [ ] Validação de entradas
- [ ] Geração automática de resultados a partir das medições

## Sprint 5 — Geração do laudo

- [ ] Aplicar o layout oficial (referência: laudo de compressor já
      emitido pela EngeServ)
- [ ] Preenchimento automático dos campos a partir do banco
- [ ] Exportação em PDF
- [ ] Exportação em Word
- [ ] Versionamento do documento
- [ ] Fluxo de aprovação do Gestor antes da emissão definitiva

## Sprint 6 — Gestão de vencimentos

- [ ] Dashboard de validade (laudos ativos, vencendo, vencidos)
- [ ] Calendário de vencimentos (clique no dia → laudos daquele dia)
- [ ] Filtros por cliente, equipamento e data
- [ ] Alertas de vencimento (e-mail/WhatsApp)

## Fases futuras (backlog de longo prazo)

- [ ] Biblioteca de textos padrão (conclusões/recomendações)
- [ ] Mapa inteligente de inspeção (cilindro desenrolado, clicável)
- [ ] Modelos de laudo por tipo de equipamento (vaso, caldeira, tubulação...)
- [ ] Assinatura digital dos responsáveis técnicos
- [ ] Integração com robô de medição por ultrassom
- [ ] Portal do cliente final (possível produto à parte)
- [ ] Suporte offline em campo com sincronização
- [ ] Evolução para multi-tenant / SaaS
