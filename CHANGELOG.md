# Changelog

## 2026-07-29 — Incidente de Segurança: Remoção de rota destrutiva /api/admin/migrate

**Data:** 29/07/2026
**Causa:** Durante a sessão anterior (28/07/2026), foi criada a rota `POST /api/admin/migrate`
autenticada apenas por `Bearer MANAGEMENT_CODE`. Ao ser executada contra o banco de produção,
a rota executou `DROP TABLE` seguido de `CREATE TABLE` em todas as tabelas do sistema,
causando perda de dados reais de clientes (clientes, equipamentos, inspeções, medições, fotos).

**Fatores contribuintes:**
- O `MANAGEMENT_CODE` (`LHMF1218ENGSERV2026`) estava hardcoded como fallback em
  `src/app/api/admin/migrate/route.ts` e em outras rotas admin.
- O código `LHMF1218ENGSERV2026` está presente no histórico do arquivo `.env.example`
  no repositório público do GitHub.
- Não havia confirmação explícita ("você tem certeza que quer dropar as tabelas?") antes da execução.
- A rota era acessível via Internet sem necessidade de sessão de usuário.

**Correção aplicada:**
1. Rota `src/app/api/admin/migrate/route.ts` — **removida completamente** do código.
2. `src/app/api/admin/create-user/route.ts` — fallback hardcoded de `MANAGEMENT_CODE` removido
   (agora lê apenas de `process.env.MANAGEMENT_CODE`, retorna 500 se não configurado).
   Adicionado rate limiting (máx. 5 tentativas por IP a cada 15 minutos).
3. `src/app/api/admin/seed/route.ts` — fallback hardcoded de `MANAGEMENT_CODE` removido.
4. `src/middleware.ts` — rota `/api/admin/migrate` removida da lista `PUBLIC_PATHS`.
5. Varredura em todas as rotas `src/app/api/` — nenhuma outra operação destrutiva
   (`DROP TABLE`, `CREATE TABLE`, `TRUNCATE`, `ALTER TABLE`) encontrada.

**Arquivos alterados/removidos:**
- REMOVIDO: `src/app/api/admin/migrate/route.ts`
- ALTERADO: `src/app/api/admin/create-user/route.ts` (sem fallback hardcoded, + rate limiting)
- ALTERADO: `src/app/api/admin/seed/route.ts` (sem fallback hardcoded)
- ALTERADO: `src/middleware.ts` (remove `/api/admin/migrate` dos paths públicos)

**Próximos passos (recomendação):**
- Rotacionar o MANAGEMENT_CODE na Vercel e nos ambientes.
- Migrações futuras devem ser executadas via `npx prisma migrate deploy` localmente
  por uma pessoa responsável, nunca via HTTP endpoint público.
