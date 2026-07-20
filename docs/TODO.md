# TODO.md

Backlog de curto prazo. Itens concluídos migram para `CHANGELOG.md`.

## Concluído na Sprint 1

- [x] Criar projeto Next.js (App Router) + Tailwind
- [x] Criar schema Prisma (User, Client, Equipment)
- [x] Criar autenticação (login, logout, sessão via cookie)
- [x] Criar middleware de proteção de rotas
- [x] Criar sidebar + topbar responsivos
- [x] Criar dashboard com KPIs reais
- [x] Criar módulo de Usuários (criar Gestor/Funcionário com permissão)
- [x] Criar script de seed do Administrador Master
- [x] Criar páginas placeholder: Clientes, Equipamentos, Inspeções, Laudos,
      Validades, Configurações
- [x] Configurar `vercel.json` / instruções de deploy
- [x] Escrever docs/PROJECT_RULES.md, ARCHITECTURE.md, ROADMAP.md,
      TODO.md, CHANGELOG.md, NR13_BUSINESS_RULES.md

## Próximos (peça ao Hermes um de cada vez, começando pelo primeiro)

- [x] Formulário de cadastro de Cliente (criar/editar/listar)
- [x] Formulário de cadastro de Equipamento (criar/editar/listar,
      vinculado a um Cliente)
- [x] Tela de edição/desativação de usuário
- [x] Cadastro de Responsável Técnico (pode nascer como campo dentro de
      Usuários ou entidade própria — decidir na Sprint 2)
- [ ] Upload de fotos categorizadas (Sprint 3)
- [ ] Mapa de pontos de medição por ultrassom (Sprint 3)
- [ ] Motor de cálculo NR-13 (Sprint 4 — depende de
      `NR13_BUSINESS_RULES.md` estar validado com o engenheiro responsável)
- [ ] Geração de PDF/Word do laudo (Sprint 5)
- [ ] Calendário de validades (Sprint 6)

## Dívidas técnicas conhecidas

- [ ] Trocar SQLite por Postgres antes do primeiro deploy real de produção
      (ver ARCHITECTURE.md → "Banco de dados em produção")
- [ ] Definir política de rotação do `AUTH_SECRET` em produção
- [ ] Avaliar rate limiting no endpoint de login
