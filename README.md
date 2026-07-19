# EngeServ Inspector

Plataforma de gestão de inspeções e integridade mecânica conforme a
NR-13 — Sprint 1 (estrutura base / fundação).

> Leia `docs/PROJECT_RULES.md` antes de continuar o desenvolvimento com o
> Hermes (ou qualquer outro agente). Esse arquivo é a "constituição" do
> projeto.

## O que já existe nesta entrega (Sprint 1)

- Autenticação com 3 papéis: Administrador Master, Gestor, Funcionário
- Layout com sidebar/topbar e navegação entre os módulos
- Dashboard inicial com KPIs reais (clientes, equipamentos, usuários)
- Banco de dados (Prisma) com os modelos `User`, `Client`, `Equipment`
- Módulo de Usuários funcional (criação de Gestor/Funcionário com
  checagem de permissão)
- Páginas placeholder para Clientes, Equipamentos, Inspeções, Laudos,
  Validades e Configurações — a implementar nas próximas sprints
  (ver `docs/ROADMAP.md`)

O que **não** existe ainda, de propósito (regra da Sprint 1 no
`PROJECT_RULES.md`): cálculos da NR-13, geração de PDF/Word, calendário de
validades. Isso é o trabalho das Sprints 2 a 6.

---

## 1. Rodando em localhost

Pré-requisitos: Node.js 18+ instalado.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env
# Abra o .env e ajuste AUTH_SECRET (qualquer string aleatória longa) e,
# se quiser, o email/senha do Administrador Master (SEED_ADMIN_EMAIL /
# SEED_ADMIN_PASSWORD). O MANAGEMENT_CODE já vem preenchido com o valor
# que vocês definiram.

# 3. Criar o banco de dados local (SQLite) a partir do schema
npx prisma db push

# 4. Criar a primeira conta de Administrador Master
npm run db:seed

# 5. Rodar o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:3000` — você será redirecionado para `/login`.
Entre com o email/senha definidos em `SEED_ADMIN_PASSWORD` no `.env`.

Como Administrador Master, vá em **Usuários** para criar as contas de
Gestor. Como Gestor, crie as contas de Funcionário.

> **Nota:** o comando `npx prisma generate` (ou o `postinstall` do
> `npm install`) baixa o "motor" do Prisma na primeira vez — isso exige
> acesso à internet normal (não requer nenhuma porta especial). Se você
> estiver atrás de um proxy corporativo restritivo, isso pode falhar; do
> seu computador em casa/escritório normal deve funcionar sem ação
> extra.

---

## 2. Deploy na Vercel

Eu não tenho acesso à sua conta Vercel nem ao GitHub, então estes passos
precisam ser feitos por você (leva poucos minutos):

### 2.1 Banco de dados de produção

O SQLite usado em localhost **não funciona na Vercel** (o sistema de
arquivos das funções serverless é apagado a cada execução). Antes do
deploy:

1. Crie um banco Postgres gratuito — as opções mais simples são
   [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) ou
   [Neon](https://neon.tech) (ambos têm plano gratuito e se integram bem
   com a Vercel).
2. Copie a `DATABASE_URL` de conexão fornecida.
3. Em `prisma/schema.prisma`, troque:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   por:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### 2.2 Subir o código para o GitHub

```bash
git init
git add .
git commit -m "Sprint 1: estrutura base do EngeServ Inspector"
# crie um repositório vazio no GitHub e depois:
git remote add origin <url-do-seu-repositorio>
git branch -M main
git push -u origin main
```

### 2.3 Importar o projeto na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o
   repositório do GitHub que você acabou de criar.
2. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → a connection string do Postgres criado no passo 2.1
   - `AUTH_SECRET` → uma string aleatória longa (gere uma nova, diferente
     da usada em localhost)
   - `MANAGEMENT_CODE` → pode manter o mesmo ou trocar
   - `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` → dados
     do Administrador Master de produção
3. Clique em **Deploy**.
4. Depois do primeiro deploy, rode a criação das tabelas e o seed do
   Admin Master apontando para o banco de produção. O jeito mais simples
   é rodar localmente uma vez, apontando para a `DATABASE_URL` de
   produção:
   ```bash
   DATABASE_URL="<url-do-postgres-de-producao>" npx prisma db push
   DATABASE_URL="<url-do-postgres-de-producao>" \
     SEED_ADMIN_EMAIL="..." SEED_ADMIN_PASSWORD="..." MANAGEMENT_CODE="..." \
     npm run db:seed
   ```
5. Acesse a URL gerada pela Vercel (`https://seu-projeto.vercel.app`) e
   faça login com a conta de Admin Master criada.

A partir daí, todo `git push` na branch `main` gera um novo deploy
automático na Vercel.

---

## 3. Estrutura da documentação

```
docs/
├── PROJECT_RULES.md        ← regras permanentes (leia sempre primeiro)
├── ARCHITECTURE.md         ← arquitetura técnica detalhada
├── ROADMAP.md              ← fases de desenvolvimento (sprints)
├── CHANGELOG.md            ← histórico de alterações
├── TODO.md                 ← backlog de tarefas
└── NR13_BUSINESS_RULES.md  ← regras de engenharia (a preencher antes da Sprint 4)
```

## 4. Próximo passo sugerido

Peça ao Hermes, em uma sessão nova, começando com:

> "Leia `docs/PROJECT_RULES.md` e `docs/ROADMAP.md` antes de qualquer
> coisa. Vamos iniciar a Sprint 2 — Cadastro: cadastro completo de
> Clientes e Equipamentos, com formulário, listagem e edição, seguindo o
> padrão já usado no módulo de Usuários."
