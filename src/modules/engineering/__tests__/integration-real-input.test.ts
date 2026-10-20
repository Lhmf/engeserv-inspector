/**
 * Testes de integração do runCalculationFromInput
 * Garante que o motor de engenharia executa com dados REAIS
 * (equipamento + medições da inspeção) e não com casos predefinidos/mocks.
 *
 * Executar: npx tsx src/modules/engineering/__tests__/integration-real-input.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { EngineeringIntegrationService } from "../integration/service";
import { buildCalculationInput } from "../index";
import type { EquipmentData, InspectionData, MeasurementPoint } from "../types";

function makeEquipment(overrides: Partial<EquipmentData> = {}): EquipmentData {
  return {
    id: "eq-real-1",
    tag: "V-REAL",
    type: "VASO_DE_PRESSAO",
    designPressureBar: 20,
    originalThicknessMm: 12,
    minThicknessMm: 5.5,
    designCode: "ASME VIII-1",
    bodyMaterial: "SA-516 Gr.70",
    jointEfficiency: 1.0,
    corrosionAllowanceMm: 3.0,
    operatingPressureBar: 15,
    operatingTempC: 50,
    volumeLiters: 5000,
    ...overrides,
  };
}

function makeInspection(overrides: Partial<InspectionData> = {}): InspectionData {
  return {
    id: "insp-real-1",
    equipmentId: "eq-real-1",
    inspectorId: "user-1",
    status: "APROVADA",
    startedAt: new Date("2026-01-10"),
    completedAt: new Date("2026-01-15"),
    approvedAt: new Date("2026-01-16"),
    approvedById: "user-2",
    type: "PERIODICA",
    ...overrides,
  };
}

function makeMeasurements(thicknesses: number[]): MeasurementPoint[] {
  return thicknesses.map((t, i) => ({
    id: `meas-${i + 1}`,
    inspectionId: "insp-real-1",
    point: `P${i + 1}`,
    thicknessMm: t,
    angleDeg: i * 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

function buildRealInput(
  equipment = makeEquipment(),
  inspection = makeInspection(),
  measurements = makeMeasurements([10.2, 9.8, 10.5, 9.9])
) {
  return buildCalculationInput(equipment, inspection, measurements);
}

test("runCalculationFromInput executa com dados reais e preserva o equipmentId (não cai no caso V-101)", async () => {
  const service = new EngineeringIntegrationService();
  const result = await service.runCalculationFromInput(buildRealInput(), "eq-real-1");

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.equal(result.data.equipmentId, "eq-real-1");
  assert.equal(result.data.inspectionId, "insp-real-1");
  assert.ok(result.data.calculations.length > 0);
});

test("runCalculationFromInput usa a menor espessura REAL medida (não valores simulados)", async () => {
  const service = new EngineeringIntegrationService();
  // Menor medição 4.9 mm < mínima 5.5 mm → equipamento CONDENADO
  const result = await service.runCalculationFromInput(
    buildRealInput(undefined, undefined, makeMeasurements([10.2, 4.9, 10.5, 9.9])),
    "eq-real-1"
  );

  assert.equal(result.success, true);
  assert.ok(result.data);
  assert.equal(result.data.overallStatus, "CONDENADO");
  const hasCriticalRisk = result.data.riskFactors.some((rf) => rf.severity === "CRITICAL");
  assert.ok(hasCriticalRisk);
});

test("runCalculationFromInput calcula taxa de corrosão real quando há inspeção anterior", async () => {
  const service = new EngineeringIntegrationService();
  const input = buildRealInput(
    makeEquipment(),
    makeInspection(),
    makeMeasurements([9.5, 9.8, 10.0, 9.7])
  );
  // 1 ano atrás: 10.5 mm → taxa ≈ (10.5 - 9.5) / 1 = 1.0 mm/ano
  input.previousMinThicknessMm = 10.5;
  input.previousInspectionDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const result = await service.runCalculationFromInput(input, "eq-real-1");

  assert.equal(result.success, true);
  assert.ok(result.data);
  const corrosion = result.data.calculations.find((c) => c.label === "Taxa de Corrosão");
  assert.ok(corrosion, "resultado de taxa de corrosão deve existir");
});

test("runCalculationFromInput recusa input inválido (ficha técnica incompleta) com erro explícito", async () => {
  const service = new EngineeringIntegrationService();
  // Equipamento sem espessuras/pressão de projeto — como fica se o cadastro for incompleto
  const sparseEquipment = makeEquipment({
    designPressureBar: undefined,
    originalThicknessMm: undefined,
    minThicknessMm: undefined,
  });
  const result = await service.runCalculationFromInput(
    buildRealInput(sparseEquipment),
    "eq-real-1"
  );

  assert.equal(result.success, false);
  assert.ok(result.error);
  assert.match(result.error, /Validação falhou/);
});

test("runCalculationFromInput recusa espessura mínima >= espessura original", async () => {
  const service = new EngineeringIntegrationService();
  const inconsistent = makeEquipment({ originalThicknessMm: 5, minThicknessMm: 6 });
  const result = await service.runCalculationFromInput(buildRealInput(inconsistent), "eq-real-1");

  assert.equal(result.success, false);
  assert.match(result.error ?? "", /INCONSISTENT_THICKNESS|espessura mínima/i);
});
