/**
 * Testes Unitários — RemainingLifeCalculator
 * 
 * AGUARDANDO VALORES OFICIAIS DO ENGENHEIRO RESPONSÁVEL
 */

import { RemainingLifeCalculator } from '../calculations/remaining-life';
import type { RemainingLifeInput, RemainingLifeResult } from '../calculations';

describe('RemainingLifeCalculator', () => {
  let calculator: RemainingLifeCalculator;

  beforeEach(() => {
    calculator = new RemainingLifeCalculator();
  });

  describe('validate()', () => {
    it('should reject missing currentThicknessMm', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('currentThicknessMm');
    });

    it('should reject missing minimumThicknessMm', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 0,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('minimumThicknessMm');
    });

    it('should reject missing corrosionRateMmPerYear', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: undefined as any,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('corrosionRateMmPerYear');
    });

    it('should reject when current <= minimum (CRITICAL)', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 5.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.severity === 'CRITICAL' && e.code === 'BELOW_MINIMUM_THICKNESS')).toBe(true);
    });

    it('should warn when current == minimum', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 5.5,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'BELOW_MINIMUM_THICKNESS')).toBe(true);
    });

    it('should warn on zero/negative corrosion rate', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0,
      };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'ZERO_OR_NEGATIVE_CORROSION_RATE')).toBe(true);
    });

    it('should accept valid input', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(true);
    });

    it('should accept valid input with safety margin', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
        safetyMarginMm: 1.0,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(true);
    });

    it('should accept valid input with next inspection date', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
        nextInspectionDate: new Date('2025-01-15'),
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculate()', () => {
    it('should return ERROR for invalid input', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 5.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.calculate(input);
      expect(result.status).toBe('ERROR');
      expect(result.criticality).toBe('CRITICAL');
    });

    it('should calculate remaining life with positive corrosion rate', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.calculate(input);

      expect(result.value).toBeDefined();
      if (result.value) {
        // (10.0 - 5.5) / 0.15 = 30 anos
        expect(result.value.remainingLifeYears).toBeCloseTo(30.0, 1);
        expect(result.value.remainingLifeMonths).toBeCloseTo(360, 0);
        expect(result.value.thicknessMarginMm).toBeCloseTo(4.5, 1);
        expect(result.value.recommendedInspectionIntervalMonths).toBeLessThanOrEqual(60);
      }
      expect(result.unit).toBe('anos');
      expect(result.normativeReference).toContain('API 570');
      expect(result.normativeReference).toContain('API 510');
      expect(result.normativeReference).toContain('NR-13');
    });

    it('should calculate with safety margin', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
        safetyMarginMm: 1.0,
      };
      const result = calculator.calculate(input);

      if (result.value) {
        // (10.0 - 5.5 - 1.0) / 0.15 = 23.3 anos
        expect(result.value.remainingLifeYears).toBeCloseTo(23.3, 1);
        expect(result.value.thicknessMarginMm).toBeCloseTo(4.5, 1);
      }
    });

    it('should calculate projected thickness at next inspection', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
        nextInspectionDate: new Date('2025-01-15'), // ~0.5 anos
      };
      const result = calculator.calculate(input);

      if (result.value) {
        // 10.0 - (0.15 * 0.5) = 9.925
        expect(result.value.projectedThicknessAtNextInspectionMm).toBeCloseTo(9.9, 1);
        expect(result.value.willSurviveNextInspection).toBe(true);
      }
    });

    it('should detect if will NOT survive next inspection', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 5.7,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.5,
        nextInspectionDate: new Date('2025-01-15'), // ~0.5 anos
      };
      const result = calculator.calculate(input);

      if (result.value) {
        // 5.7 - (0.5 * 0.5) = 5.45 < 5.5
        expect(result.value.projectedThicknessAtNextInspectionMm).toBeLessThan(5.5);
        expect(result.value.willSurviveNextInspection).toBe(false);
      }
    });

    it('should return infinite life for zero corrosion rate', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0,
      };
      const result = calculator.calculate(input);

      if (result.value) {
        expect(result.value.remainingLifeYears).toBe(999); // Infinity sentinel
        expect(result.value.remainingLifeMonths).toBe(999);
        expect(result.reliability).toBe('LOW');
      }
      expect(result.observations.some(o => o.includes('Sem corrosão'))).toBe(true);
    });

    it('should set criticality based on remaining life', () => {
      // CRITICAL: < 1 year
      const inputCritical: RemainingLifeInput = {
        currentThicknessMm: 5.6,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const resultCritical = calculator.calculate(inputCritical);
      expect(resultCritical.criticality).toBe('CRITICAL');

      // HIGH: 1-3 years
      const inputHigh: RemainingLifeInput = {
        currentThicknessMm: 5.9,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const resultHigh = calculator.calculate(inputHigh);
      expect(resultHigh.criticality).toBe('HIGH');

      // MEDIUM: 3-5 years
      const inputMed: RemainingLifeInput = {
        currentThicknessMm: 6.4,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const resultMed = calculator.calculate(inputMed);
      expect(resultMed.criticality).toBe('MEDIUM');

      // LOW: > 5 years
      const inputLow: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const resultLow = calculator.calculate(inputLow);
      expect(resultLow.criticality).toBe('LOW');
    });

    it('should set status based on remaining life', () => {
      const inputWarn: RemainingLifeInput = {
        currentThicknessMm: 5.6,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const resultWarn = calculator.calculate(inputWarn);
      expect(resultWarn.status).toBe('WARNING');

      const inputSuccess: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const resultSuccess = calculator.calculate(inputSuccess);
      expect(resultSuccess.status).toBe('SUCCESS');
    });

    it('should include metadata', () => {
      const input: RemainingLifeInput = {
        currentThicknessMm: 10.0,
        minimumThicknessMm: 5.5,
        corrosionRateMmPerYear: 0.15,
      };
      const result = calculator.calculate(input);

      expect(result.metadata).toEqual(
        expect.objectContaining({
          calculationId: expect.stringMatching(/^rl-\d+$/),
          calculatedAt: expect.any(Date),
          formulaVersion: expect.any(String),
          normativeVersion: expect.stringContaining('API'),
          inputs: expect.objectContaining(input),
        })
      );
    });
  });
});

/*
=================================================================
CASOS DE TESTE PARA PREENCHER APÓS VALIDAÇÃO DO ENGENHEIRO
=================================================================

CASO 1: Vida útil básica
-------------------------
Input:
  currentThicknessMm: 10.0
  minimumThicknessMm: 5.5
  corrosionRateMmPerYear: 0.15

Esperado:
  remainingLifeYears: 30.0
  remainingLifeMonths: 360
  thicknessMarginMm: 4.5
  recommendedInspectionIntervalMonths: 15 (metade de 30, max 60)
  criticality: 'LOW'
  status: 'SUCCESS'

CASO 2: Com margem de segurança
-------------------------------
Input:
  currentThicknessMm: 10.0
  minimumThicknessMm: 5.5
  corrosionRateMmPerYear: 0.15
  safetyMarginMm: 1.0

Esperado:
  remainingLifeYears: 23.3
  thicknessMarginMm: 4.5

CASO 3: Próxima inspeção (sobrevive)
------------------------------------
Input:
  currentThicknessMm: 10.0
  minimumThicknessMm: 5.5
  corrosionRateMmPerYear: 0.15
  nextInspectionDate: 2025-01-15 (~0.5 anos)

Esperado:
  projectedThicknessAtNextInspectionMm: 9.9
  willSurviveNextInspection: true

CASO 4: Próxima inspeção (NÃO sobrevive)
----------------------------------------
Input:
  currentThicknessMm: 5.7
  minimumThicknessMm: 5.5
  corrosionRateMmPerYear: 0.5
  nextInspectionDate: 2025-01-15 (~0.5 anos)

Esperado:
  projectedThicknessAtNextInspectionMm: 5.45
  willSurviveNextInspection: false

CASO 5: Taxa zero = vida infinita
----------------------------------
Input:
  corrosionRateMmPerYear: 0

Esperado:
  remainingLifeYears: 999
  reliability: 'LOW'
  observations: contém 'Sem corrosão'

CASO 6: CRITICAL (< 1 ano)
--------------------------
Input:
  currentThicknessMm: 5.6
  minimumThicknessMm: 5.5
  corrosionRateMmPerYear: 0.15

Esperado:
  remainingLifeYears: 0.67
  criticality: 'CRITICAL'
  status: 'WARNING'
  observations: contém 'VIDA ÚTIL CRÍTICA'

CASO 7: HIGH (1-3 anos)
-----------------------
Input:
  currentThicknessMm: 5.9
  minimumThicknessMm: 5.5
  corrosionRateMmPerYear: 0.15

Esperado:
  remainingLifeYears: 2.67
  criticality: 'HIGH'

=================================================================
*/