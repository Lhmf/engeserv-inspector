# Validação técnica do laudo

## Fluxo

1. O inspetor conclui a inspeção e abre o laudo.
2. O cartão **Validação técnica** mostra, em linguagem objetiva, cada bloqueio.
3. O inspetor seleciona **Solicitar validação ao Administrador Master**.
4. O Administrador Master recebe uma notificação no sino do sistema.
5. O Administrador Master confere as medições, a ficha técnica e o critério dos pontos não medidos.
6. Ao selecionar **Aprovar validação e liberar PDF**, a decisão fica registrada no histórico do laudo.
7. O botão de exportação muda para **PDF definitivo** e a prévia deixa de ser demonstrativa.

## Regra de segurança

A aprovação registra a decisão do responsável sobre o conjunto persistido naquele laudo. Ela não altera fórmulas, medições ou valores. Sem essa aprovação, as rotas de PDF/HTML definitivo continuam respondendo `409`; a prévia demonstrativa permanece disponível e identificada como demonstração.

Somente `ADMIN_MASTER` pode aprovar ou rejeitar. Funcionários e gestores podem solicitar a validação, mas não liberam a emissão.

## Configuração

Para gerar o PDF definitivo, o ambiente também precisa conter os dados reais da empresa emitente: `REPORT_COMPANY_NAME` e `REPORT_COMPANY_CNPJ`. Sem eles, a tela informa exatamente quais variáveis faltam.
