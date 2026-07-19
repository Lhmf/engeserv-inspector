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
