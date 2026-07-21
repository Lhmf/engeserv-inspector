# LAUDO_TEMPLATE_STRUCTURE.md

Estrutura do laudo de referência (Compressor Chiaperini, TAG 26075),
anotada pela equipe: **laranja = texto fixo** (igual em qualquer laudo),
**não marcado = variável** (dado específico da inspeção). Na "placa" de
identificação (Anexo, página 13): **preto = rótulo fixo**, **azul = dado
digitado**.

> Diferente do `NR13_BUSINESS_RULES.md`, este documento **não** trata de
> fórmulas de cálculo — é sobre a estrutura do documento (Módulo 7 —
> Gerador de Laudo, e a "biblioteca de textos" do Módulo de Configurações).
> Não precisa de validação de engenharia, porque é transcrição de texto já
> emitido e assinado pelo Edison num laudo real.

## 1. Seções do laudo — fixo x variável

| Seção | Status | Observação |
|---|---|---|
| Cabeçalho/rodapé (logo, título, DOC/PÁGINA/REVISÃO/DATA) | Fixo (layout) | DOC/PÁGINA/REVISÃO/DATA variam |
| 1. Solicitante | Variável | Dados do cliente |
| 2-4. Identificação / Dados do vaso / Dados de projeto | Variável | Ficha técnica do equipamento |
| Aviso "empresa deve informar a ENGSERV..." (item 4, antes da seção 5) | **Fixo**, 1 campo variável (nome do cliente) | Candidato à biblioteca de textos |
| 5. Classificação — texto explicativo | **Fixo** | Explicação da norma (P×V) |
| 5. Classificação — valores (Classe/Grupo/Categoria) | Variável | Resultado por equipamento |
| 6. Empresa Inspetora (dados do Edison/EngeServ) | **Fixo** | Sempre a EngeServ, não redigita |
| 7. Análise dos documentos (7.1 a 7.5) | **Fixo**, com toggle SIM/NÃO | Texto de cada resultado (RSV/PAR/RTI/CCS) é padrão |
| 8.1 Exame externo (8.1.1-8.1.4) | **Fixo** | Checklist padrão |
| 8.2 Placa de identificação — texto instrutivo | **Fixo** | Só "possui/não possui" varia |
| 8.3-8.5 Válvula/Manômetro/Pressostato — frase descritiva | **Fixo**, valores variáveis | Frase pronta + números digitados |
| 9.1 Medição por ultrassom — parágrafos explicativos | **Fixo** | Só os números da tabela variam |
| 10. Equipamentos utilizados na inspeção | **Fixo** (revisar se muda por inspeção) | Aparelho MT-190 etc. |
| 12. Recomendações (12.1 a 12.8) | **Fixo** — quase 100% | = biblioteca de textos do briefing original |
| 13. Conclusão | **Fixo**, poucos campos (nome equip., TAG) | Texto legal padrão |
| 13. Data próxima inspeção — texto legal | **Fixo** | |
| 14. Responsabilidade Técnica | **Fixo** | Dados do Edison sempre iguais |

## 2. Textos fixos candidatos à "biblioteca de textos" (Módulo Configurações)

Transcrição literal, para reuso no gerador de laudo (Sprint 5):

**Aviso de reparo/alteração** (variável: `{cliente}`):
> "A empresa {cliente} deve informar a ENGSERV-ENGENHARIA E SERVIÇOS, junto ao Profissional Legalmente Habilitado sempre que for executar qualquer reparo ou alteração que venha a comprometer a segurança do vaso de pressão, meio ambiente e colaboradores."

**Explicação de classificação (fixo, sem variáveis):**
> "Os vasos de pressão são classificados em categorias segundo o tipo de fluído e o potencial em função do produto P.V onde P é a pressão máxima de operação em Mpa e V é o volume geométrico interno em m³ (Item 13.5.1.2)."

**Recomendações 12.1 a 12.8** — transcrever integralmente do laudo (já
estão no PDF original); no sistema, cada uma vira um item selecionável
independente, exatamente como no briefing inicial ("o gestor marca, o
sistema monta o texto automaticamente").

**Conclusão** (variável: `{tipo_equipamento}`, `{tag}`, `{item_referencia}`):
> "Conforme Norma ABNT NBR 15417 e NR-13 conclui-se que o Vaso de Pressão {tipo_equipamento} TAG:{tag} encontra-se APTO para prosseguir em operação até a data da próxima inspeção de acordo com item {item_referencia} deste documento desde que as exigências de melhorias e recomendações escritas no item 12 deste documento sejam todas atendidas."

> Nota: essas transcrições devem ser conferidas palavra por palavra contra
> o PDF original antes de virarem texto definitivo no sistema — copiei do
> texto extraído, que pode ter pequenas diferenças de acentuação/quebra de
> linha em relação ao PDF renderizado.

## 3. Placa de identificação (Anexo, pág. 13) — mapeamento para o Equipment

| Rótulo na placa (fixo) | Valor no laudo (variável) | Campo no schema atual | Status |
|---|---|---|---|
| Código de Localização | VP-26075 | `tag` | OK |
| Descrição | Compressor de Ar | `description` | OK |
| Série | 352549 | — | **faltando** (`serialNumber`) |
| Código de Projeto | ASME SEC.VIII div.I/2021 | — | **faltando** (`designCode`) |
| Pressão de Projeto | N/I | `designPressureBar`? | **ambíguo — ver nota abaixo** |
| Temperatura de Projeto | 100 ºC | — | **faltando** (`designTempC`) |
| Pressão de Operação | 9,7 Kgf/cm² | — | **faltando** (`operatingPressureBar`) |
| Temperatura de Operação | 60 ºC | — | **faltando** (`operatingTempC`) |
| Pressão Máx. Trab. Admissível (PMTA) | 10,6 Kgf/cm² | — | **faltando** (`mawpBar`) |
| Pressão Teste Hidrostático (PTH) | 13,9 Kgf/cm² | — | **faltando** (`hydroTestPressureBar`) |
| Tampo (tipo/material) | Semielíptico / SA-36 | — | **faltando** (`headType`, `headMaterial`) |
| Espessura Nominal Casco | 3,47 mm | `originalThicknessMm`? | **ambíguo — só serve para casco** |
| Espessura Nominal Tampos | 3,00 mm | — | **faltando** (`headNominalThicknessMm`) |
| Volume | 150,0 litros | — | **faltando** (`volumeLiters`) |
| Eficiência de Solda | 0,7 | — | **faltando** (`jointEfficiency`) |
| Fluido | Ar Comprimido | — | **faltando** (`fluidType`) |
| Classe / Grupo / Categoria | C / 5 / V | — | **faltando** (`fluidClass`, `riskGroup`, `nr13Category`) — manual por enquanto, até a fórmula P×V ser confirmada |
| Fabricante | Chiaperini | `manufacturer` | OK |
| Ano de Fabricação | 2024 | `manufactureYear` | OK |
| Empresa de Inspeção | ENGSERV (fixo) | — | Não precisa de campo — é constante do sistema, não do equipamento |

**Nota sobre a ambiguidade de pressão/espessura:** o schema atual tem
`designPressureBar` (um campo genérico) e `originalThicknessMm` (um campo
genérico). O laudo real mostra que isso não é suficiente: existem três
pressões distintas (projeto, operação, PMTA) e duas espessuras nominais
distintas (casco e tampo). Recomendo dividir esses campos antes da
Sprint 5, ou o gerador de laudo não vai conseguir preencher a placa
corretamente.

## 4. Próximo passo sugerido

Isso pode avançar **independente** das perguntas pendentes ao Edison sobre
fórmulas — é só modelagem de dados e texto padrão, não cálculo. Dá pra
pedir ao Hermes:

1. Estender o modelo `Equipment` no `prisma/schema.prisma` com os campos
   listados como "faltando" acima (todos opcionais/nullable, para não
   quebrar equipamentos já cadastrados).
2. Criar um novo modelo `TextoPadrao` (ou `RecommendationTemplate`) para a
   biblioteca de recomendações (item 12.1-12.8 e futuras), selecionável
   por checkbox na tela de inspeção.
3. Atualizar o formulário de cadastro de Equipamento (Sprint 2) para
   incluir os novos campos.

Isso é seguro para rodar em produção porque só adiciona colunas opcionais
— mas, como já existe um banco real com dados da Boreste, a prática
correta é: rodar a migração local primeiro, revisar o SQL gerado, e só
depois aplicar em produção (não fazer `db push` direto na produção sem
revisar).