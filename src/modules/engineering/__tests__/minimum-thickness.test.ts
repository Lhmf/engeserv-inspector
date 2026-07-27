/**
 * Testes Unitários — MinimumThicknessCalculator
 * 
 * AGUARDANDO VALORES OFICIAIS DO ENGENHEIRO RESPONSÁVEL
 */

import { MinimumThicknessCalculator } from '../calculations/minimum-thickness';
import type { MinimumThicknessInput } from '../calculations';

describe('MinimumThicknessCalculator', () => {
  let calculator: MinimumThicknessCalculator;

  beforeEach(() => {
    calculator = new MinimumThicknessCalculator();
  });

  describe('validate()', () => {
    const validInput: MinimumThicknessInput = {
      designPressureBar: 25.0,
      insideDiameterMm: 1000,
      jointEfficiency: 1.0,
      allowableStressMpa: 138,
      corrosionAllowanceMm: 3.0,
      designCode: 'ASME_VIII_DIV1',
    };

    it('should reject missing designPressureBar', () => {
      const input = { ...validInput, designPressureBar: 0 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('designPressureBar');
    });

    it('should reject negative designPressureBar', () => {
      const input = { ...validInput, designPressureBar: -1 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'NEGATIVE_PRESSURE')).toBe(true);
    });

    it('should reject missing insideDiameterMm', () => {
      const input = { ...validInput, insideDiameterMm: 0 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('insideDiameterMm');
    });

    it('should reject invalid jointEfficiency', () => {
      const inputs = [
        { ...validInput, jointEfficiency: 0 },
        { ...validInput, jointEfficiency: -0.1 },
        { ...validInput, jointEfficiency: 1.5 },
      ];

      inputs.forEach(input => {
        const result = calculator.validate(input);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('jointEfficiency');
      });
    });

    it('should warn on uncommon jointEfficiency', () => {
      const input = { ...validInput, jointEfficiency: 0.9 };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'UNCOMMON_EFFICIENCY')).toBe(true);
    });

    it('should reject missing allowableStressMpa', () => {
      const input = { ...validInput, allowableStressMpa: 0 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('allowableStressMpa');
    });

    it('should reject negative corrosionAllowanceMm', () => {
      const input = { ...validInput, corrosionAllowanceMm: -1 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'NEGATIVE_ALLOWANCE')).toBe(true);
    });

    it('should warn on excessive corrosionAllowanceMm', () => {
      const input = { ...validInput, corrosionAllowanceMm: 100 };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'EXCESSIVE_ALLOWANCE')).toBe(true);
    });

    it('should reject pressure exceeding formula limit (CRITICAL)', () => {
      // P < S*E/0.6 for ASME VIII-1 UG-27
      // With S=138, E=1.0: max P = 138/0.6 = 230 MPa = 2300 bar
      // But let's use a case where it exceeds
      const input = { 
        ...validInput, 
        designPressureBar: 5000, // Way too high
        allowableStressMpa: 100,
        jointEfficiency: 1.0,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'PRESSURE_EXCEEDS_FORMULA_LIMIT')).toBe(true);
    });

    it('should reject missing designCode', () => {
      const input = { ...validInput, designCode: undefined as any };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('designCode');
    });

    it('should accept valid input', () => {
      const result = calculator.validate(validInput);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculate()', () => {
    it('should return ERROR for invalid input', () => {
      const input: MinimumThicknessInput = {
        designPressureBar: 0,
        insideDiameterMm: 1000,
        jointEfficiency: 1.0,
        allowableStressMpa: 138,
        corrosionAllowanceMm: 3.0,
        designCode: 'ASME_VIII_DIV1',
      };
      const result = calculator.calculate(input);
      expect(result.status).toBe('ERROR');
      expect(result.criticality).toBe('CRITICAL');
    });

    it('should calculate t_min for ASME VIII-1 cylindrical shell', () => {
      const input: MinimumThicknessInput = {
        designPressureBar: 25.0,
        insideDiameterMm: 1000,
        jointEfficiency: 1.0,
        allowableStressMpa: 138,
        corrosionAllowanceMm: 3.0,
        designCode: 'ASME_VIII_DIV1',
      };
      const result = calculator.calculate(input);

      expect(result.value).toBeDefined();
      if (result.value) {
        // P = 2.5 MPa, R = 500 mm
        // t = (2.5 * 500) / (138 * 1.0 - 0.6 * 2.5) + 3.0
        // t = 1250 / (138 - 1.5) + 3.0 = 1250 / 136.5 + 3.0 = 9.16 + 3.0 = 12.16 mm
        expect(result.value.minimumThicknessMm).toBeCloseTo(12.16, 1);
        expect(result.value.nominalThicknessMm).toBeGreaterThan(result.value.minimumThicknessMm);
        expect(result.value.components.pressureComponentMm).toBeCloseTo(9.16, 1);
        expect(result.value.components.corrosionAllowanceMm).toBe(3.0);
      }
      expect(result.unit).toBe('mm');
      expect(result.normativeReference).toContain('ASME VIII-1 UG-27');
      expect(result.normativeReference).toContain('NR-13');
    });

    it('should set status to WARNING (placeholder)', () => {
      const input = validInput();
      const result = calculator.calculate(input);
      expect(result.status).toBe('WARNING');
      expect(result.reliability).toBe('THEORETICAL');
    });

    it('should include placeholder observations', () => {
      const result = calculator.calculate(validInput());
      expect(result.observations.some(o => o.includes('PLACEHOLDER'))).toBe(true);
      expect(result.observations.some(o => o.includes('NÃO USAR EM PRODUÇÃO'))).toBe(true);
    });

    it('should include metadata', () => {
      const result = calculator.calculate(validInput());
      expect(result.metadata).toEqual(
        expect.objectContaining({
          calculationId: expect.stringMatching(/^tmin-\d+$/),
          calculatedAt: expect.any(Date),
          formulaVersion: expect.any(String),
          normativeVersion: expect.stringContaining('ASME'),
        })
      );
    });
  });
});

function validInput(): MinimumThicknessInput {
  return {
    designPressureBar: 25.0,
    insideDiameterMm: 1000,
    jointEfficiency: 1.0,
    allowableStressMpa: 138,
    corrosionAllowanceMm: 3.0,
    designCode: 'ASME_VIII_DIV1',
  };
}

/*
=================================================================
CASOS DE TESTE PARA PREENCHER APÓS VALIDAÇÃO DO ENGENHEIRO
=================================================================

CASO 1: ASME VIII-1 Cilindro (UG-27) - Básico
----------------------------------------------
Input:
  designPressureBar: 25.0 (2.5 MPa)
  insideDiameterMm: 1000
  jointEfficiency: 1.0
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1'

Esperado:
  pressureComponentMm: ~9.16
  minimumThicknessMm: ~12.16
  nominalThicknessMm: ~13.38 (12.16 * 1.1)
  formulaUsed: 't = (P * R) / (S * E - 0.6 * P) + Ca'

CASO 2: ASME VIII-1 Cilindro (E = 0.85)
----------------------------------------
Input:
  jointEfficiency: 0.85
  (outros iguais)

Esperado:
  pressureComponentMm: ~10.78 (maior porque E menor)
  minimumThicknessMm: ~13.78

CASO 3: ASME VIII-1 Tampo Elipsoidal (UG-32)
---------------------------------------------
Input:
  designPressureBar: 25.0
  insideDiameterMm: 1000
  jointEfficiency: 1.0
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1' (precisa diferenciar)

Esperado:
  t = (P * D) / (2 * S * E - 0.2 * P) + Ca
  P = 2.5 MPa, D = 1000 mm
  t = (2.5 * 1000) / (2 * 138 * 1.0 - 0.2 * 2.5) + 3.0
  t = 2500 / (276 - 0.5) + 3.0 = 2500 / 275.5 + 3.0 = 9.07 + 3.0 = 12.07 mm

CASO 4: ASME VIII-1 Tampo Torisférico (UG-32)
----------------------------------------------
Input:
  designCode: 'ASME_VIII_DIV1' (precisa saber M = fator de forma)

Esperado:
  t = (P * D) / (2 * S * E * M - 0.2 * P) + Ca
  M = fator de forma (depende de L/r do torisférico)

CASO 5: ASME VIII-1 Tampo Hemisférico (UG-32)
----------------------------------------------
Input:
  designCode: 'ASME_VIII_DIV1'

Esperado:
  t = (P * R) / (2 * S * E - 0.2 * P) + Ca
  t = (2.5 * 500) / (2 * 138 * 1.0 - 0.2 * 2.5) + 3.0
  t = 1250 / (276 - 0.5) + 3.0 = 4.54 + 3.0 = 7.54 mm

CASO 6: ASME VIII-1 Casco Esférico (UG-27)
-------------------------------------------
Input:
  designCode: 'ASME_VIII_DIV1' (específico esférico)

Esperado:
  t = (P * R) / (2 * S * E - 0.2 * P) + Ca
  t = (2.5 * 500) / (2 * 138 * 1.0 - 0.2 * 2.5) + 3.0 = 4.54 + 3.0 = 7.54 mm

CASO 7: API 650 (Tanque Atmosférico)
-------------------------------------
Input:
  designPressureBar: 0.5 (muito baixa)
  insideDiameterMm: 50000
  jointEfficiency: 0.85
  allowableStressMpa: 138
  corrosionAllowanceMm: 1.5
  designCode: 'API_650'

Esperado:
  Para tanque atmosférico, fórmula diferente:
  t = (P * D) / (2 * S * E) + Ca (aproximado)
  Pressão de projeto tipicamente em kPa/mbar, não bar

CASO 8: Pressão excede limite da fórmula (ERROR)
-------------------------------------------------
Input:
  designPressureBar: 5000 (absurdamente alto)
  allowableStressMpa: 100
  jointEfficiency: 1.0

Esperado:
  status: 'ERROR'
  criticality: 'CRITICAL'
  errors: contém 'PRESSURE_EXCEEDS_FORMULA_LIMIT'

CASO 9: Valor incomum de E (WARNING)
-------------------------------------
Input:
  jointEfficiency: 0.9

Esperado:
  warnings: contém 'UNCOMMON_EFFICIENCY'

=================================================================
*/