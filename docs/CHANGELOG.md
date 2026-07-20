# CHANGELOG.md

Todas as entregas do projeto, em ordem cronológica. Atualize a cada
sessão de trabalho concluída.

## 19/07/2026 — Sprint 1: Estrutura base

- Criado o projeto Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- Criado o schema inicial do banco de dados (Prisma): `User`, `Client`,
  `Equipment`.
- Implementada autenticação própria (sessão via cookie httpOnly assinado
  com JWT), com três papéis: Administrador Master, Gestor e Funcionário.
- Implementado middleware de proteção de rotas.
- Criado script de seed para o primeiro Administrador Master (usa o
  `MANAGEMENT_CODE` apenas nesse momento único).
- Criado layout autenticado com sidebar (navegação por módulo) e topbar
  (usuário logado + logout).
- Criado dashboard inicial com KPIs reais de clientes, equipamentos e
  usuários (KPIs de laudos/validades aguardando Sprint 5/6).
- Criado módulo de Usuários funcional: Admin Master cria Gestor;
  Admin Master ou Gestor criam Funcionário — com checagem de permissão no
  backend, não apenas na interface.
- Criadas páginas placeholder para Clientes, Equipamentos, Inspeções,
  Laudos, Validades e Configurações, cada uma indicando em qual sprint
  futura será implementada.
- Escrita a documentação viva do projeto: `PROJECT_RULES.md`,
  `ARCHITECTURE.md`, `ROADMAP.md`, `TODO.md`, `NR13_BUSINESS_RULES.md`.
- Configurado para deploy na Vercel e para rodar em `localhost`
  (instruções completas em `README.md`).

## 20/07/2026 — Sprint 2: Cadastro de Clientes e Equipamentos

**Entregas:**

- **Clientes (CRUD completo):**
  - Listagem em `/clientes` com tabela (empresa, CNPJ, responsável, equipamentos, status, data)
  - Cadastro em `/clientes/novo` com formulário: razão social, CNPJ (formatação automática), endereço, contato (nome, telefone, email), responsável técnico (select com Gestores ativos)
  - API `/api/clientes` (GET lista, POST cria) + `/api/clientes/[id]` (GET detalhe, PUT atualiza, DELETE desativa)
  - Validações: CNPJ único (14 dígitos), email válido, responsável deve ser Gestor ativo
  - Soft delete: desativa cliente só se não tiver equipamentos ativos

- **Equipamentos (CRUD completo):**
  - Listagem em `/equipamentos` com filtro por cliente (TAG, tipo, cliente, descrição, data)
  - Cadastro em `/equipamentos/novo` com formulário: cliente (select), TAG (única por cliente), tipo (enum NR-13), descrição, fabricante, ano, pressão de projeto, espessura original, espessura mínima
  - API `/api/equipamentos` (GET lista com filtro opcional clientId, POST cria)
  - Validações: TAG única por cliente, cliente ativo, tipos conforme NR-13

- **Responsável Técnico:** campo `responsibleId` no Cliente vinculando a usuários com role GESTOR ativo

- **Usuários:** refinada tela `/usuarios` mantendo criação com permissão (Admin Master cria Gestor/Funcionário, Gestor cria Funcionário)

**Arquitetura:** mesmo padrão visual e de componentes do módulo Usuários (NewUserForm → NewClientForm/NewEquipmentForm, tabelas consistentes, formulários em grid responsivo, validações Zod, permissões via `src/lib/auth.ts`)

**Deploy:** Vercel automático via push no GitHub; banco Supabase Postgres com migração `active` em Client e Equipment

**Problema:** Existia rota pública `/cadastrar` e endpoint `/api/auth/register`
acessíveis sem autenticação, permitindo que qualquer pessoa criasse contas de
Funcionário (sem código) ou Gestor (informando o `MANAGEMENT_CODE`). Isso
contradizia o `PROJECT_RULES.md`: apenas Admin Master cria Gestor; apenas Admin
Master ou Gestor (autenticados) criam Funcionário.

**Ação corretiva:**
1. Removida página pública `/cadastrar` (redireciona para `/login`).
2. Removido endpoint público `/api/auth/register` (retorna 410 Gone).
3. Removido link "Cadastrar" da tela de login.
4. Criação de usuários mantida exclusivamente na tela autenticada `/usuarios`,
   com checagem de permissão via `canCreateGestor` / `canCreateFuncionario` em
   `src/lib/auth.ts`.

**Contas criadas indevidamente pelo formulário público (identificadas em
20/07/2026):**
- `testegestor@exemplo.com` (GESTOR) — criada em 03:24
- `testefunc@exemplo.com` (FUNCIONARIO) — criada em 03:24
- `br4energia.luiz@gmail.com` (GESTOR) — criada em 12:28 (possivelmente com
  código de gerência)

**Recomendação:** Admin Master deve revisar essas contas em `/usuarios` e
desativar/remover as de teste. Trocar `MANAGEMENT_CODE` e `AUTH_SECRET` nas
Environment Variables da Vercel (previsto para ser feito manualmente pelo
responsável).

## 20/07/2026 — Sprint 2: Cadastro de Clientes e Equipamentos

**Entregue:** Cadastro completo de Clientes e Equipamentos com validações de negócio.

**Clientes (`/clientes` + `/clientes/novo`):**
- Listagem com busca, status ativo/inativo, responsável técnico, contagem de equipamentos
- Formulário de cadastro: razão social, CNPJ (único, formatação automática), endereço, contato (nome/telefone/email), responsável técnico (dropdown só Gestores ativos)
- Validações: CNPJ único, responsável deve ser Gestor ativo
- API: GET/POST `/api/clientes`, GET/PUT/DELETE `/api/clientes/[id]`

**Equipamentos (`/equipamentos` + `/equipamentos/novo`):**
- Listagem vinculada a cliente, TAG, tipo, descrição, inspeções
- Formulário de cadastro: cliente (dropdown ativos), TAG (única por cliente), tipo (enum 9 tipos NR-13), descrição, fabricante, ano, dados de projeto NR-13 (pressão bar, espessura original/mínima mm)
- Validações: TAG única por cliente (índice composto), cliente ativo
- API: GET/POST `/api/equipamentos` (com filtro `?clientId=`)

**Banco de dados:**
- Campo `active` adicionado em `Client` e `Equipment` (soft delete)
- Índice único composto `clientId+tag` em Equipment
- Campo `phone` já existia em User

**Próximos passos (Sprint 3):** Inspeções, medições, fotos, cálculos NR-13.
