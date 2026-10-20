# Changelog

## 2026-07-19 Ã¢â‚¬â€ Lote 10: Concluir o Portal do Cliente Engeserv

**Data:** 19/07/2026
**DescriÃƒÂ§ÃƒÂ£o:** Melhorias no portal do cliente com foco em usabilidade e organizaÃƒÂ§ÃƒÂ£o:
- Adicionado filtragem e busca nas pÃƒÂ¡ginas de equipamentos, laudos, documentos, frentes e recomendaÃƒÂ§ÃƒÂµes.
- Melhoria na organizaÃƒÂ§ÃƒÂ£o visual com botÃƒÂµes de filtro e campos de busca.
- AtualizaÃƒÂ§ÃƒÂ£o de terminologia na pÃƒÂ¡gina do dashboard para maior clareza.
- PreservaÃƒÂ§ÃƒÂ£o de toda a funcionalidade existente e identidade visual.
- ImplementaÃƒÂ§ÃƒÂ£o sem invention de dados, usando apenas os dados reais do banco.

**Arquivos alterados:**
- src/app/portal/dashboard/page.tsx
- src/app/portal/equipamentos/page.tsx
- src/app/portal/laudos/page.tsx
- src/app/portal/documentos/page.tsx
- src/app/portal/frentes/page.tsx
- src/app/portal/recomendacoes/page.tsx

## 2026-07-29 Ã¢â‚¬â€ Incidente de SeguranÃƒÂ§a: RemoÃƒÂ§ÃƒÂ£o de rota destrutiva /api/admin/migrate

**Data:** 29/07/2026
**Causa:** Durante a sessÃƒÂ£o anterior (28/07/2026), foi criada a rota `POST /api/admin/migrate`
autenticada apenas por `Bearer MANAGEMENT_CODE`. Ao ser executada contra o banco de produÃƒÂ§ÃƒÂ£o,
a rota executou `DROP TABLE` seguido de `CREATE TABLE` em todas as tabelas do sistema,
causando perda de dados reais de clientes (clientes, equipamentos, inspeÃƒÂ§ÃƒÂµes, mediÃƒÂ§ÃƒÂµes, fotos).

**Fatores contribuintes:**
- O `MANAGEMENT_CODE` (`LHMF1218ENGSERV2026`) estava hardcoded como fallback em
  `src/app/api/admin/migrate/route.ts` e em outras rotas admin.
- O cÃƒÂ³digo `LHMF1218ENGSERV2026` estÃƒÂ¡ presente no histÃƒÂ³rico do arquivo `.env.example`
  no repositÃƒÂ³rio pÃƒÂºblico do GitHub.
- NÃƒÂ£o havia confirmaÃƒÂ§ÃƒÂ£o explÃƒÂ­cita ("vocÃƒÂª tem certeza que quer dropar as tabelas?") antes da execuÃƒÂ§ÃƒÂ£o.
- A rota era acessÃƒÂ­vel via Internet sem necessidade de sessÃƒÂ£o de usuÃƒÂ¡rio.

**CorreÃƒÂ§ÃƒÂ£o aplicada:**
1. Rota `src/app/api/admin/migrate/route.ts` Ã¢â‚¬â€ **removida completamente** do cÃƒÂ³digo.
2. `src/app/api/admin/create-user/route.ts` Ã¢â‚¬â€ fallback hardcoded de `MANAGEMENT_CODE` removido
   (agora lÃƒÂª apenas de `process.env.MANAGEMENT_CODE`, retorna 500 se nÃƒÂ£o configurado).
   Adicionado rate limiting (mÃƒÂ¡x. 5 tentativas por IP a cada 15 minutos).
3. `src/app/api/admin/seed/route.ts` Ã¢â‚¬â€ fallback hardcoded de `MANAGEMENT_CODE` removido.
4. `src/middleware.ts` Ã¢â‚¬â€ rota `/api/admin/migrate` removida da lista `PUBLIC_PATHS`.
5. Varredura em todas as rotas `src/app/api/` Ã¢â‚¬â€ nenhuma outra operaÃƒÂ§ÃƒÂ£o destrutiva
   (`DROP TABLE`, `CREATE TABLE`, `TRUNCATE`, `ALTER TABLE`) encontrada.

**Arquivos alterados/removidos:**
- REMOVIDO: `src/app/api/admin/migrate/route.ts`
- ALTERADO: `src/app/api/admin/create-user/route.ts` (sem fallback hardcoded, + rate limiting)
- ALTERADO: `src/app/api/admin/seed/route.ts` (sem fallback hardcoded)
- ALTERADO: `src/middleware.ts` (remove `/api/admin/migrate` dos paths pÃƒÂºblicos)

**RotaÃƒÂ§ÃƒÂ£o do MANAGEMENT_CODE (29/07/2026 Ã¢â‚¬â€ mesma sessÃƒÂ£o):**
- O valor antigo `LHMF1218ENGSERV2026` estava no histÃƒÂ³rico pÃƒÂºblico do GitHub (`.env.example`).
- Removido da Vercel (Production) e substituÃƒÂ­do por novo valor gerado com `openssl rand -hex 24`.
- Apenas o ambiente Production continha a variÃƒÂ¡vel (Preview/Development nÃƒÂ£o).
- Novo valor testado: cÃƒÂ³digo antigo Ã¢â€ â€™ 403, cÃƒÂ³digo novo Ã¢â€ â€™ 200.
- `AUTH_SECRET` nÃƒÂ£o foi rotacionado (nÃƒÂ£o hÃƒÂ¡ evidÃƒÂªncia de vazamento; decisÃƒÂ£o separada).

**PrÃƒÂ³ximos passos (recomendaÃƒÂ§ÃƒÂ£o):**
- MigraÃƒÂ§ÃƒÂµes futuras devem ser executadas via `npx prisma migrate deploy` localmente
  por uma pessoa responsÃƒÂ¡vel, nunca via HTTP endpoint pÃƒÂºblico.
## 2026-07-31 Ã¢â‚¬â€ Lote 11: Prepare client portal for commercial demonstration

**Data:** 31/07/2026
**DescriÃƒÂ§ÃƒÂ£o:** Preparado o portal do cliente para demonstraÃƒÂ§ÃƒÂ£o comercial com foco em usabilidade, apresentaÃ§Ã£o profissional e navegaÃ§Ã£o completa.
- Corrigido erros de TypeScript e JSX na pÃƒÂ¡gina do dashboard.
- Implementado estados de loading, erro e vazio na pÃƒÂ¡gina do calendÃƒÂ¡rio.
- Convertido cartÃµes KPI do dashboard em links com filtros apropriados.
- Ordenado a seÃƒÂ§ÃƒÂ£o "Atividade recente" por data em ordem decrescente.
- Verificado navegaÃƒÂ§ÃƒÂ£o entre dashboard, listas e pÃƒÂ¡ginas de detalhe.
- Mantida a identidade visual existente e a autenticaÃƒÂ§ÃƒÂ£o via portal_session.
- Validado com tsc e build (sem erros).
- Atualizado TODO e CHANGELOG com os resultados.

**Arquivos alterados:**
- src/app/portal/dashboard/page.tsx
- src/app/portal/calendario/page.tsx