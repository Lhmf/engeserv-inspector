# PROJECT RULES

**Projeto:** EngeServ Inspector — Software de Geração de Relatórios e Laudos Técnicos (NR-13)
**Versão:** MVP 1.0
**Última atualização:** Sprint 1 — Estrutura base

> Leia este arquivo antes de escrever qualquer código. Ele é a memória de
> longo prazo do projeto — o código é a memória de curto prazo.

---

## OBJETIVO

Desenvolver uma plataforma de gestão de inspeções NR-13 para a EngeServ.

O software **não** deve ser tratado como um simples gerador de PDF. Toda
geração de documentos é consequência das informações armazenadas no banco
de dados. O sistema deve estar preparado para crescimento constante — novos
módulos poderão ser adicionados no futuro sem necessidade de reescrever o
projeto.

---

## FILOSOFIA

Sempre priorizar:

- Código limpo
- Arquitetura modular
- Componentes reutilizáveis
- Fácil manutenção e expansão
- Interface simples
- Performance
- Organização

## O QUE NÃO FAZER

- Nunca duplicar código.
- Nunca misturar regra de negócio com interface.
- Nunca criar cálculos dentro dos componentes visuais.
- Nunca gerar PDFs/Word usando informações digitadas diretamente na tela —
  todo documento é gerado a partir do banco de dados.
- Nunca acoplar regras de negócio (NR-13, permissões) à interface.

---

## ESTRUTURA DO SISTEMA

O sistema é dividido em módulos independentes, com baixo acoplamento:

1. Autenticação / Usuários
2. Clientes
3. Equipamentos
4. Inspeções
5. Medições
6. Fotos
7. Motor de Cálculo NR-13
8. Geração de Laudos (PDF/Word)
9. Dashboard
10. Gestão de Validades
11. Configurações

---

## PADRÃO DE DESENVOLVIMENTO

- Sempre explicar rapidamente as decisões importantes.
- Sempre reutilizar componentes.
- Sempre usar funções pequenas e nomes claros.
- Evitar arquivos gigantes, funções acima de ~80 linhas, componentes enormes.
- Toda regra de cálculo (NR-13) deve ficar isolada em módulo próprio
  (ver `NR13_BUSINESS_RULES.md`), nunca dentro de componentes de tela.
- O layout dos laudos pode mudar no futuro sem alterar a lógica do sistema.

## MVP

Este projeto é um MVP funcional. Não buscar perfeição — primeiro entregar
um sistema funcional, depois melhorar. O protótipo sofrerá muitas
alterações; isso é esperado e normal.

---

## USUÁRIOS E PERMISSÕES

Três papéis:

| Papel | Pode | Não pode |
|---|---|---|
| **Administrador Master** | Único que cria contas de **Gestor**. Acesso total. | — |
| **Gestor** | Cria contas de **Funcionário**, revisa, aprova, assina, gera PDF/Word, edita conclusão e recomendações, libera o documento. | — |
| **Funcionário** | Cadastra cliente/equipamento, cria inspeção, lança medições, anexa fotos, preenche checklist. | Gerar laudo definitivo, alterar fórmulas, excluir inspeções, aprovar inspeções. |

Regras adicionais:

- O código de gerência (`MANAGEMENT_CODE`) é usado **apenas** para criar a
  primeira conta de Administrador Master via script de seed — nunca fica
  exposto dentro do sistema em uso normal.
- Até 5 usuários simultâneos nesta fase.
- Ao finalizar um laudo em campo, o Funcionário depende do aceite ("check")
  de um usuário Gestor antes de qualquer emissão definitiva.

---

## DOCUMENTOS

O sistema deve gerar laudos em **PDF** e **Word**. No futuro, outros
formatos poderão ser adicionados. Os cálculos seguem rigorosamente a NR-13
e normas correlatas (ASME, API quando aplicável), com liberdade de
parametrização dentro do escopo do laudo-modelo já utilizado pela EngeServ
(ver PDF de referência: laudo de compressor).

---

## DASHBOARD

Deve sempre exibir indicadores de:

- Laudos ativos
- Laudos vencidos
- Próximos vencimentos
- Inspeções em andamento
- Clientes
- Equipamentos
- Calendário de validades

---

## ESCOPO DESTE PROTÓTIPO (decisões já validadas)

- Uso exclusivo da EngeServ nesta fase (arquitetura pronta para
  multi-tenant/SaaS no futuro, mas não implementado agora).
- Medições inseridas manualmente. A empresa possui um robô de medição, mas
  com limite de operação (não opera em tubulações inferiores a 200 mm) —
  integração futura.
- Assinatura digital **não** incluída no protótipo — assinatura manual por
  ora.
- Emissão e consulta de ART fazem parte do escopo.
- Sistema deve suportar uso offline em campo, sincronizando depois
  (não implementado na Sprint 1).
- Notificações automáticas de vencimento (e-mail/WhatsApp) fazem parte do
  escopo (fases futuras).
- Portal do cliente final é um entregável futuro, possivelmente um produto
  à parte.

---

## FUTURO

O sistema deverá permitir expansão para:

- Portal do Cliente
- Integração com ART
- Assinatura digital
- Aplicativo mobile
- Integração com equipamentos de medição por ultrassom
- Integração com WhatsApp / E-mail
- Multiempresa (multi-tenant) / SaaS
- Novos tipos de inspeção (NR-12, etc.)

---

## COMO USAR ESTE ARQUIVO COM O HERMES

No início de toda nova sessão de trabalho, diga ao Hermes:

> "Leia primeiro `docs/PROJECT_RULES.md` e `docs/NR13_BUSINESS_RULES.md`
> antes de escrever qualquer código, e siga rigorosamente esses documentos."

Sempre que uma tarefa terminar, o Hermes deve atualizar `docs/CHANGELOG.md`
e marcar os itens correspondentes em `docs/TODO.md` / `docs/ROADMAP.md`.
