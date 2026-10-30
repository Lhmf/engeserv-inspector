import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessTechnicalReportEmission } from "../../src/modules/report/safety/emission";
import { makeLote21bReportFixture } from "./fixtures/lote21b-report";

describe("validação técnica explícita", () => {
  it("mantém o PDF definitivo bloqueado enquanto não houver aprovação", () => {
    const assessment = assessTechnicalReportEmission(makeLote21bReportFixture({ validated: false }));
    assert.equal(assessment.canEmitDefinitive, false);
    assert.equal(assessment.technicalValidationStatus, "PENDING");
    assert.ok(assessment.reasons.some((reason) => reason.includes("Validação técnica pendente")));
  });

  it("libera a emissão quando o Master aprova o conjunto persistido", () => {
    const report = makeLote21bReportFixture({ validated: false });
    report.metadata = {
      ...report.metadata,
      regionalAdoptionApproved: true,
      technicalValidation: {
        status: "APPROVED",
        approvedAt: "2026-10-30T12:00:00.000Z",
        approvedById: "master-1",
      },
    };
    const assessment = assessTechnicalReportEmission(report);
    assert.equal(assessment.technicalValidationApproved, true);
    assert.equal(assessment.canEmitDefinitive, true);
    assert.deepEqual(assessment.reasons, []);
  });
});
