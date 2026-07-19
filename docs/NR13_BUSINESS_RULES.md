# NR13_BUSINESS_RULES.md

**Este arquivo não contém código.** Ele existe para separar completamente
a engenharia (o que é calculado e por quê) da implementação técnica (como
é calculado no sistema). Quando o Hermes for desenvolver o motor de
cálculo (Sprint 4), ele deve consultar este documento em vez de
"inventar" interpretações da NR-13.

> **Status:** esqueleto a ser preenchido pelo responsável técnico da
> EngeServ antes da Sprint 4. Propositalmente **não incluímos fórmulas
> aqui ainda** — cálculos de pressão e espessura mínima têm implicação
> direta em segurança, e devem ser validados e assinados por um
> engenheiro habilitado antes de virarem código, não assumidos por uma
> IA. Isto está alinhado com a Sprint 1 do `ROADMAP.md`: "Ainda NÃO
> desenvolver regras da NR13".

## O que precisa ser documentado aqui antes da Sprint 4

### 1. Classificação e escopo
- Quais categorias de equipamento o sistema deve cobrir (caldeiras, vasos
  de pressão, tubulações, silos, tanques...) e as normas aplicáveis a
  cada uma (NR-13, e quando aplicável ASME, API).
- Diferença entre inspeção **inicial**, **periódica** e **extraordinária**
  — e o que muda no cálculo/documento entre elas.

### 2. Parâmetros de projeto necessários por equipamento
- Pressão de projeto, pressão de trabalho, pressão admissível.
- Espessura original de fabricação.
- Material, tensão admissível do material, eficiência de junta soldada.
- Diâmetro/geometria relevante para a fórmula de espessura mínima.

### 3. Fórmulas (a preencher e validar)
- Espessura mínima admissível.
- Pressão admissível / de trabalho / de projeto.
- Taxa de corrosão (mm/ano) — método de cálculo a partir de espessura
  original x atual x tempo de operação.
- Vida útil remanescente.
- Coeficiente de segurança e margem operacional.
- Regra de negócio já indicada informalmente: a "camisa" do cilindro deve
  manter coeficiente de segurança compatível com espessura mínima acima de
  **2,5 mm**, desconsiderando corrosão adicional — **confirmar com o
  responsável técnico se esse valor é fixo para todos os equipamentos ou
  varia por tipo/norma antes de codificar como constante.**

### 4. Textos padrão
- Biblioteca de frases de conclusão, recomendação e observação usadas
  atualmente pelos engenheiros (ver Sprint futura "Biblioteca de textos"
  no `ROADMAP.md`).

### 5. Casos especiais
- Situações em que o cálculo padrão não se aplica (equipamentos fora de
  faixa, normas alternativas, exceções já usadas pela EngeServ).

## Fluxo recomendado

1. O responsável técnico da EngeServ preenche as seções acima (pode ser em
   reuniões curtas, uma seção por vez).
2. Este documento é revisado e aprovado antes de virar código.
3. Só então a Sprint 4 (Motor de Cálculos) começa, implementando cada
   fórmula como uma função isolada e testável em `src/lib/nr13/`, citando
   a seção correspondente deste documento no comentário do código.
