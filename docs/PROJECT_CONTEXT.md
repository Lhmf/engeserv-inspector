# PROJECT CONTEXT

## Lote F3 em andamento
- Foram adicionadas validações de tipo, extensão e tamanho para fotos e documentos; endpoints de debug bcrypt e listagem administrativa foram removidos (`410`), e o seed administrativo aceita o código somente no cabeçalho `Authorization`.
- A matriz Playwright inclui capturas da tela interna e do Portal em tema claro, tema escuro e viewport `390x844`; os artefatos ficam em `docs/demo/f3/`.
- A bateria QA inclui uploads, rate limit do Portal e superfícies de segurança. A Preview continua protegida por SSO; não houve bypass nem alteração de produção.
- A Preview precisa manter banco de teste, `AUTH_SECRET` e os dados institucionais configurados antes da emissão definitiva. Fórmulas placeholder e critério regional continuam bloqueando a emissão definitiva por `409`.

Atualizado em 2026-10-22 para esta etapa.

## Base atual
- Branch: `lote-c-correcao-tipos-build`
- Commit mais recente: `b962070` (atualizado em D5)
- Lockfile de `@playwright/test` sincronizado; workflow continua usando Node 24.x, Prisma 5.19.1 e PostgreSQL temporário
- Preview anterior válida (sem mudanças funcionais de aplicação): https://engeserv-inspector-2ci8l04si-the-castilho.vercel.app
- Preview oficial: https://engeserv-inspector-2tgi0u0h5-the-castilho.vercel.app
- Target da implantação: `preview`
- Produção não foi modificada.

## O que foi concluído
- Correção dos erros de TypeScript/build.
- Barreira de emissão de PDF intacta e testada (26 testes passando).
- Testes de segurança/autenticação do Portal do Cliente passando (24 testes).
- Build Next.js concluído com sucesso.
- Branch publicada no remoto e Preview Vercel implantada.
- Commit da Preview confirmado pela metadata Vercel: `4a08877e6bbde435e9d214baee405f6985342eac`.

## O que ainda precisa validação funcional
- Jornada completa autenticada por perfil.
- Cadastro e seleção de cliente/equipamento em ambiente com dados demonstrativos.
- Cálculo real, geração e emissão protegida de PDF.
- Exportação Word, onde compatível.

## Bloqueio concreto
- Lote F2 (2026-10-28): commits `45845e8afd093f9c92c86fbb02a9900748a5ed0e` e `e2a49f6040da1fdf08486cdfac95366cd03f4841` publicados em `lote-c-correcao-tipos-build`.
- Preview: `https://engeserv-inspector-git-lote-c-correcao-tipos-build-the-castilho.vercel.app`; deploy READY e protegido por SSO da Vercel. Produção não foi modificada.
- Portal: limite por IP/conta, bloqueio temporário, mensagem genérica, normalização de recomendações e validação das 9 leituras reais.
- HTML oficial, PDF, seed/admin e debug respeitam autenticação e a barreira de emissão; pipeline não expõe exceções internas.
- Evidências: TypeScript passou; build passou; QA `53 passed, 1 skipped`; smoke `4 passed`; F1c `2 passed`; F1d `4 passed` após atualizar o contrato de HTML bloqueado.
- Preview possui `POSTGRES_URL`, `PRISMA_DATABASE_URL` e `AUTH_SECRET`; `REPORT_COMPANY_NAME` e `REPORT_COMPANY_CNPJ` estão ausentes e precisam ser cadastradas antes da emissão definitiva.
- Pendências: credencial Portal ainda é nome + prefixo CNPJ; rate limit em memória; fórmulas aguardam Edison; comparação DOCX/PDF permanece para o próximo lote.
- Publicação de laudo agora também é bloqueada com `409` quando engenharia ou critérios regionais não estão validados.
- Não foram executados testes de navegador/fluxo autenticado nesta etapa. O próximo passo é validar end-to-end com credenciais autorizadas e dados claramente identificados como demonstração, sem promoção para produção.
