# Guia de teste da Preview

**URL:** `https://engeserv-inspector-git-lote-c-correcao-tipos-build-the-castilho.vercel.app`

A Preview exige o SSO da Vercel. Abra a URL no navegador, conclua o SSO com sua conta autorizada e só então use o aplicativo. Não use a URL de produção.

## Contas de demonstração

| Perfil | E-mail | Senha padrão |
|---|---|---|
| Master | `admin@engeserv.com.br` | `demo123456` |
| Gestor | `gestor@engeserv.com.br` | `demo123456` |
| Funcionário | `demo@engeserv.com.br` | `demo123456` |

As contas dependem do seed do banco de teste da Preview. O Portal não tem senha fixa: Cliente A e Cliente B devem ser criados no roteiro, usando o nome da empresa e o prefixo de seis dígitos do CNPJ informado no cadastro.

## Roteiro no celular (390 × 844)

1. Abra a Preview, passe pelo SSO e entre como Master.
2. Crie o Cliente A e anote o nome e o prefixo do CNPJ.
3. Cadastre um equipamento desse cliente, preenchendo tag e ficha técnica.
4. Crie a inspeção selecionando exatamente esse equipamento.
5. Registre as nove medições de campo PM-01 a PM-09 e envie a inspeção.
6. Gere o laudo; o cálculo atual aparece como estimativa não validada.
7. Abra a prévia oficial: a emissão definitiva deve responder `409` enquanto a validação técnica estiver pendente.
8. Baixe o PDF demonstrativo pelo fluxo identificado como demonstração.
9. Repita o cadastro para o Cliente B e crie um equipamento separado.
10. Entre no Portal como Cliente A e confirme que não aparecem equipamentos, inspeções ou laudos do Cliente B; repita a conferência como Cliente B.

## Resultado esperado

O bloqueio `409` é intencional e protege a emissão definitiva até a validação das fórmulas pelo responsável técnico e a aprovação do critério dos pontos não medidos. Funcionário não emite documento definitivo (`403`). O PDF demonstrativo permanece explicitamente marcado como demonstração.
