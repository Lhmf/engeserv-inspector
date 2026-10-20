/**
 * Lote 16C — Testes QA: regras de validade (src/lib/validades.ts)
 *
 * Teste 100% independente de banco e de processos Next.js.
 * Runner: node:test (built-in), executado via tsx (já instalado no repo).
 *
 * Comando:
 *   npx tsx --test tests/qa/validades.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularProximaData,
  getValidadeStatus,
  buildValidadeInfo,
  ordenarPorVencimento,
} from "../../src/lib/validades";

describe("validades: calcularProximaData", () => {
  it("retorna null quando lastApprovedAt é null", () => {
    assert.equal(calcularProximaData(null, 12), null);
  });

  it("retorna null quando periodicityMonths é null ou 0", () => {
    const d = new Date("2026-01-10T12:00:00Z");
    assert.equal(calcularProximaData(d, null), null);
    assert.equal(calcularProximaData(d, 0), null);
  });

  it("soma a periodicidade em meses sobre a última inspeção aprovada", () => {
    const last = new Date("2026-01-10T12:00:00Z");
    const next = calcularProximaData(last, 12);
    assert.ok(next);
    assert.equal(next.getUTCMonth(), 0); // janeiro + 12 = janeiro (de 2027)
    assert.equal(next.getUTCFullYear(), 2027);
    assert.equal(next.getUTCDate(), 10);
  });

  it("trata periodicsidades curtas (ex.: 6 meses, NR-13 categoria 1)", () => {
    const last = new Date("2026-03-15T12:00:00Z");
    const next = calcularProximaData(last, 6);
    assert.ok(next);
    assert.equal(next.getUTCMonth(), 8); // março + 6 = setembro
    assert.equal(next.getUTCFullYear(), 2026);
  });

  it("mantém a decisão manual: NÃO deriva periodicidade de categoria NR-13", () => {
    // periodicityMonths null continua null mesmo para categoria 1 (6 meses) — decisão do engenheiro.
    assert.equal(calcularProximaData(new Date(), null), null);
  });
});

describe("validades: getValidadeStatus", () => {
  it("retorna SEM_DATA quando não há data de vencimento", () => {
    assert.equal(getValidadeStatus(null), "SEM_DATA");
  });

  it("retorna VENCIDO quando a data está no passado", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000); // ontem
    assert.equal(getValidadeStatus(past), "VENCIDO");
  });

  it("retorna PROXIMO dentro da janela padrão de 30 dias", () => {
    const soon = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // em 10 dias
    assert.equal(getValidadeStatus(soon), "PROXIMO");
  });

  it("retorna OK fora da janela (janela customizável)", () => {
    const later = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // em 90 dias
    assert.equal(getValidadeStatus(later), "OK");
    // com janela de 120 dias, o mesmo vencimento é PROXIMO
    assert.equal(getValidadeStatus(later, 120), "PROXIMO");
  });
});

describe("validades: buildValidadeInfo", () => {
  it("propaga os dados do equipamento e computa status coerente", () => {
    const info = buildValidadeInfo({
      equipmentId: "eq-1",
      equipmentTag: "VASO-01",
      equipmentType: "PRESSURE_VESSEL",
      clientId: "cli-1",
      clientName: "Cliente Teste",
      lastApprovedAt: new Date("2026-02-01T12:00:00Z"),
      periodicityMonths: 24,
    });
    assert.equal(info.equipmentId, "eq-1");
    assert.equal(info.status, "OK"); // vencimento em 2028-02 → OK
    assert.equal(info.nextDueDate?.getUTCFullYear(), 2028);
  });

  it("usa SEM_DATA quando falta approvedAt ou periodicidade", () => {
    const info = buildValidadeInfo({
      equipmentId: "eq-2",
      equipmentTag: "TROCA-01",
      equipmentType: "HEAT_EXCHANGER",
      clientName: "Cliente Teste",
      lastApprovedAt: null,
      periodicityMonths: null,
    });
    assert.equal(info.nextDueDate, null);
    assert.equal(info.status, "SEM_DATA");
  });
});

describe("validades: ordenarPorVencimento", () => {
  it("ordena por vencimento mais próximo e joga SEM_DATA para o final", () => {
    const base = Date.parse("2026-10-01T12:00:00Z");
    const semData = {
      equipmentId: "c",
      equipmentTag: "C",
      equipmentType: "X",
      clientName: "C",
      lastApprovedAt: null,
      periodicityMonths: null,
      nextDueDate: null,
      status: "SEM_DATA" as const,
    };
    const far = {
      ...semData,
      equipmentId: "b",
      equipmentTag: "B",
      nextDueDate: new Date(base + 200 * 24 * 60 * 60 * 1000),
      status: "OK" as const,
    };
    const near = {
      ...semData,
      equipmentId: "a",
      equipmentTag: "A",
      nextDueDate: new Date(base + 5 * 24 * 60 * 60 * 1000),
      status: "PROXIMO" as const,
    };
    const sorted = ordenarPorVencimento([far, semData, near]);
    assert.deepEqual(
      sorted.map((v) => v.equipmentId),
      ["a", "b", "c"]
    );
  });
});
