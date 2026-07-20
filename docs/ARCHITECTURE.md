# ARCHITECTURE.md

Documento técnico da arquitetura do EngeServ Inspector. Leia junto com
`PROJECT_RULES.md`.

## Visão geral

```
Navegador
   │
   ▼
Next.js 14 (App Router) ── Server Components + Route Handlers (API)
   │
   ├── src/app/(app)/*        → telas autenticadas (dashboard, clientes...)
   ├── src/app/login          → tela pública de login
   ├── src/app/api/*          → rotas de API (auth, users, ...)
   ├── src/middleware.ts      → protege rotas privadas (checa cookie de sessão)
   │
   ▼
src/lib/auth.ts    → sessão (JWT em cookie httpOnly) + regras de permissão
src/lib/prisma.ts  → cliente único do Prisma (acesso a dados)
   │
   ▼
Banco de dados (SQLite local / Postgres em produção) via Prisma ORM
```

## Por que essas escolhas

- **Next.js (App Router) + Vercel**: o Hermes e você já usam esse stack em
  outros projetos (Finance Tracker, CRM, Dashboard de Vendas), e a Vercel é
  o destino de deploy pedido. Server Components permitem buscar dados
  direto do banco sem expor uma API pública desnecessária para as telas
  internas.
- **Prisma ORM**: um único `schema.prisma` documenta todas as entidades do
  sistema (Usuários, Clientes, Equipamentos, e nas próximas sprints:
  Inspeções, Medições, Fotos, Cálculos, Laudos). Migrações versionadas,
  tipos gerados automaticamente para TypeScript.
- **Autenticação própria (JWT em cookie httpOnly via `jose`)**: simples,
  sem dependências externas, funciona igual em localhost e na Vercel
  (Edge Runtime compatível), e dá controle total sobre os 3 papéis do
  sistema (Admin Master / Gestor / Funcionário) sem a complexidade de um
  provedor OAuth que não faz sentido para um sistema interno de 5 usuários.
- **Tailwind CSS**: consistente com os outros projetos, produtividade alta
  para o dashboard/CRM-like que foi pedido.

## Separação de responsabilidades (regra central do PROJECT_RULES.md)

- **Nunca** misturar regra de negócio com interface.
- Toda regra de permissão vive em `src/lib/auth.ts` (funções
  `canCreateGestor`, `canCreateFuncionario`, `canApproveInspection`,
  `canIssueFinalReport`) — as telas apenas *consultam* essas funções, nunca
  reimplementam a regra.
- Toda regra de cálculo NR-13 (a partir da Sprint 4) vai viver em um módulo
  isolado (`src/lib/nr13/`), documentado em `docs/NR13_BUSINESS_RULES.md`,
  nunca dentro de componentes de tela.
- Toda geração de documento (a partir da Sprint 5) lê exclusivamente do
  banco de dados — nenhum PDF/Word é montado a partir de campos digitados
  na hora.

## Estrutura de pastas

```
engeserv-inspector/
├── docs/                     ← documentação viva do projeto (este arquivo e os demais)
├── prisma/
│   ├── schema.prisma         ← modelo de dados
│   └── seed.ts                ← cria o primeiro Administrador Master
├── src/
│   ├── app/
│   │   ├── (app)/            ← grupo de rotas autenticadas (sidebar + topbar)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── clientes/
│   │   │   ├── equipamentos/
│   │   │   ├── inspecoes/
│   │   │   ├── laudos/
│   │   │   ├── validades/
│   │   │   ├── usuarios/
│   │   │   └── configuracoes/
│   │   ├── login/
│   │   ├── api/
│   │   │   ├── auth/login/
│   │   │   ├── auth/logout/
│   │   │   └── users/
│   │   ├── layout.tsx         ← layout raiz
│   │   ├── page.tsx           ← redireciona / -> /dashboard ou /login
│   │   └── globals.css
│   ├── components/            ← componentes reutilizáveis (Sidebar, TopBar, KpiCard...)
│   ├── lib/
│   │   ├── auth.ts             ← sessão + permissões
│   │   └── prisma.ts           ← cliente Prisma singleton
│   └── middleware.ts          ← proteção de rotas
├── .env.example
├── package.json
└── README.md
```

## Modelo de dados (Sprint 1)

Nesta etapa modelamos apenas o essencial para autenticação e o esqueleto de
cadastro:

- `User` (Admin Master / Gestor / Funcionário)
- `Client` (clientes da EngeServ)
- `Equipment` (equipamentos por cliente, com campos de projeto básicos
  como espessura original e espessura mínima — já pensando no motor NR-13)

Os modelos `Inspection`, `Measurement`, `Photo`, `Calculation` e `Report`
serão adicionados nas Sprints 3 a 5, conforme `ROADMAP.md`.

## Banco de dados em produção

- **Local (desenvolvimento)**: SQLite (`prisma/dev.db`), configurado via
  `DATABASE_URL="file:./dev.db"` no `.env`. Zero configuração, roda em
  qualquer máquina.
- **Produção (Vercel)**: SQLite **não funciona** em produção na Vercel — o
  sistema de arquivos das funções serverless é efêmero. Antes do primeiro
  deploy de produção, é necessário:
  1. Provisionar um banco Postgres (ex.: Vercel Postgres, Neon ou Supabase
     — todos têm camada gratuita suficiente para o protótipo).
  2. Trocar `provider = "sqlite"` para `provider = "postgresql"` em
     `prisma/schema.prisma`.
  3. Definir a variável `DATABASE_URL` de produção nas Environment
     Variables do projeto na Vercel.
  4. Rodar `npx prisma migrate deploy` (ou `db push`) apontando para o
     Postgres de produção.

  Isso está detalhado passo a passo no `README.md`.

## Arquitetura de armazenamento de fotos (Sprint 3)

A partir da Sprint 3, o sistema passa a lidar com upload de imagens (fotos de inspeção).
Como a Vercel roda em serverless functions com sistema de arquivos efêmero, **não é possível
salvar arquivos no disco local do projeto**. A solução adotada:

- **Vercel Blob** (https://vercel.com/docs/storage/vercel-blob) — armazenamento de objetos
  nativo da Vercel, com CDN global, URLs públicas/assinadas, e SDK simples.
- Cada foto de inspeção vira um registro no banco (`InspectionPhoto`) que guarda **apenas
  a URL do blob** e metadados (categoria, legenda, ordem). O arquivo físico **nunca** fica
  no repositório nem no filesystem da função.
- Configuração: variável de ambiente `BLOB_READ_WRITE_TOKEN` (token com permissão
  read/write do store Vercel Blob). O token é criado no painel da Vercel → Storage →
  Blob → Create Store → Copy Token.

Fluxo de upload:
1. Frontend solicita URL de upload assinada via `/api/inspections/[id]/photos/upload-url`
2. Frontend faz PUT direto para a URL do Blob (client-side, sem passar pelo backend)
3. Frontend confirma criação do registro `InspectionPhoto` no banco com a URL retornada

Isso remove carga do backend, escala automaticamente, e mantém o custo previsível.
