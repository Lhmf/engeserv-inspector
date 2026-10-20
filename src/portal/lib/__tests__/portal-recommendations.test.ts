/**
 * Testes — formatação de recomendações do Portal.
 * Runner: node:test nativo. Executar com:
 *   npx tsx src/portal/lib/__tests__/portal-recommendations.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarRecomendacoes } from "../portal-recommendations";

test("null/undefined/vazio → null", () => {
  assert.equal(formatarRecomendacoes(null), null);
  assert.equal(formatarRecomendacoes(undefined), null);
  assert.equal(formatarRecomendacoes(""), null);
  assert.equal(formatarRecomendacoes("   "), null);
  assert.equal(formatarRecomendacoes("[]"), null);
});

test("texto livre passa sem alteração", () => {
  assert.equal(formatarRecomendacoes("Lubrificar manômetro"), "Lubrificar manômetro");
});

test("array JSON de strings → linhas unidas", () => {
  const v = JSON.stringify(["Reapertar flange", "Trocar anel O"]);
  assert.equal(formatarRecomendacoes(v), "Reapertar flange\nTrocar anel O");
});

test("array JSON de {description} carrega description", () => {
  const v = JSON.stringify([{ description: "Substituir anel de vedação" }]);
  assert.equal(formatarRecomendacoes(v), "Substituir anel de vedação");
});

test("Json estruturado do laudo → seções ordenadas com bullets", () => {
  const v = {
    shortTerm: [{ description: "Recolocar espessura mínima" }],
    immediate: ["Durar até a parada"],
  };
  assert.equal(
    formatarRecomendacoes(v),
    "Ações imediatas\n- Durar até a parada\nCurto prazo\n- Recolocar espessura mínima"
  );
});

test("array direto (Json) → texto", () => {
  assert.equal(
    formatarRecomendacoes([{ description: "A" }, "B"]),
    "A\nB"
  );
});

test("objeto único com description", () => {
  assert.equal(formatarRecomendacoes(JSON.stringify({ description: "X" })), "X");
});

test("idempotência: formatar texto já formatado não altera", () => {
  const once = formatarRecomendacoes(
    JSON.stringify([{ description: "Linha 1" }, { description: "Linha 2" }])
  );
  assert.equal(formatarRecomendacoes(once), once);
  const sections = formatarRecomendacoes({
    immediate: [{ description: "I1" }],
  });
  assert.equal(formatarRecomendacoes(sections), sections);
});
