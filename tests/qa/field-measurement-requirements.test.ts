import assert from "node:assert/strict";
import test from "node:test";
import {
  missingRequiredFieldMeasurementPoints,
  REQUIRED_FIELD_MEASUREMENT_POINTS,
} from "../../src/modules/report/measurements/field-requirements";

test("exige exatamente os nove pontos de campo do fluxo", () => {
  assert.equal(REQUIRED_FIELD_MEASUREMENT_POINTS.length, 9);
  assert.deepEqual(missingRequiredFieldMeasurementPoints([]), [...REQUIRED_FIELD_MEASUREMENT_POINTS]);
  assert.deepEqual(
    missingRequiredFieldMeasurementPoints([...REQUIRED_FIELD_MEASUREMENT_POINTS, "pm-01"]),
    []
  );
  assert.deepEqual(
    missingRequiredFieldMeasurementPoints(["PM-01", "PM-02", "PM-03", "PM-04", "PM-05"]),
    ["PM-06", "PM-07", "PM-08", "PM-09"]
  );
});
