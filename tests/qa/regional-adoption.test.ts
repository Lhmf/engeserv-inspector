import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOfficialMeasurementPoints, materializeRegionalMeasurements, REGIONAL_ADOPTION_NOTE } from '../../src/modules/report/measurements/regional-adoption';
import { assessTechnicalReportEmission } from '../../src/modules/report/safety/emission';

const measurements = Array.from({ length: 9 }, (_, index) => ({
  id: `m-${index + 1}`,
  inspectionId: 'inspection-1',
  point: index < 5 ? `PM-${String(index + 1).padStart(2, '0')}` : `PM-${String(index + 6).padStart(2, '0')}`,
  thicknessMm: 10 - index * 0.1,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

test('adota o menor valor regional nos pontos não medidos', () => {
  const points = buildOfficialMeasurementPoints(measurements);
  assert.equal(points.length, 18);
  assert.equal(points[5].label, 'PM-06');
  assert.equal(points[5].value, 9.6);
  assert.equal(points[5].measured, false);
  assert.equal(points[14].label, 'PM-15');
  assert.equal(points[14].value, 9.2);
  assert.equal(points[14].note, REGIONAL_ADOPTION_NOTE);
  assert.equal(materializeRegionalMeasurements(measurements).length, 9);
});

test('aceita os identificadores legados P1/P18 e os apresenta como PM-01/PM-18', () => {
  const points = buildOfficialMeasurementPoints([
    { ...measurements[0], point: 'P1' },
    { ...measurements[1], point: 'P18' },
  ]);

  assert.equal(points[0].value, measurements[0].thicknessMm);
  assert.equal(points[0].measured, true);
  assert.equal(points[17].value, measurements[1].thicknessMm);
  assert.equal(points[17].measured, true);
});

test('bloqueia emissão definitiva sem aprovação do responsável técnico', () => {
  const assessment = assessTechnicalReportEmission({
    metadata: { regionalAdoptionApproved: false },
    engineeringResults: { formulaVersions: { minimumThickness: '1.0.0' }, integrityAnalysis: {} },
  });
  assert.equal(assessment.regionalAdoptionApproved, false);
  assert.equal(assessment.canEmitDefinitive, false);
  assert.ok(assessment.reasons.some((reason) => reason.includes('pontos não medidos')));
});
