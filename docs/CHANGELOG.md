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

## 20/07/2026 — Correção de segurança: remoção de cadastro público

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
