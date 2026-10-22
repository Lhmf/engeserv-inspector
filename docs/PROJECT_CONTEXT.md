# PROJECT CONTEXT

Atualizado em 2026-10-22 para esta etapa.

## Base atual
- Branch: `lote-c-correcao-tipos-build`
- Commit mais recente: `4a08877e6bbde435e9d214baee405f6985342eac`
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
- Não foram executados testes de navegador/fluxo autenticado nesta etapa. O próximo passo é validar end-to-end com credenciais autorizadas e dados claramente identificados como demonstração, sem promoção para produção.
