/**
 * Testes Unitários — CorrosionRateCalculator
 * 
 * AGUARDANDO VALORES OFICIAIS DO ENGENHEIRO RESPONSÁVEL
 */

import { CorrosionRateCalculator } from '../calculations';
import type { CorrosionRateInput, CorrosionRateResult } from '../calculations';

describe('CorrosionRateCalculator', () => {
  let calculator: CorrosionRateCalculator;

  beforeEach(() => {
    calculator = new CorrosionRateCalculator();
  });

  describe('validate()', () => {
    it('should reject missing currentThicknessMm', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 0,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('currentThicknessMm');
    });

    it('should reject missing previousThicknessMm', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('previousThicknessMm');
    });

    it('should reject missing timeIntervalYears', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 0,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('timeIntervalYears');
    });

    it('should reject negative time interval', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: -1,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'NEGATIVE_TIME')).toBe(true);
    });

    it('should warn when thickness increased (possible measurement error)', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 12.5, // Increased!
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'THICKNESS_INCREASED')).toBe(true);
    });

    it('should warn on very short interval', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 0.3, // < 0.5 years
      };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'SHORT_INTERVAL')).toBe(true);
    });

    it('should accept valid input', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should accept input with historical data', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
        historicalData: [
          { date: new Date('2020-01-15'), minThicknessMm: 12.5 },
          { date: new Date('2022-01-15'), minThicknessMm: 12.0 },
          { date: new Date('2024-01-15'), minThicknessMm: 11.5 },
        ],
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(true);
    });
  });

  describe('calculate()', () => {
    it('should return ERROR for invalid input', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: -1,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.calculate(input);
      expect(result.status).toBe('ERROR');
      expect(result.criticality).toBe('CRITICAL');
    });

    it('should calculate basic corrosion rate (2 points)', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.calculate(input);

      expect(result.value).toBeDefined();
      if (result.value) {
        // CR = (12.0 - 11.5) / 2.5 = 0.2 mm/ano
        expect(result.value.corrosionRateMmPerYear).toBeCloseTo(0.2, 2);
        expect(result.value.corrosionRateMpy).toBeCloseTo(0.2 * 39.3701, 1);
        expect(result.value.dataPoints).toBe(2);
        expect(result.value.trend).toBe('INCREASING'); // positive = increasing corrosion
      }
      expect(result.unit).toBe('mm/ano');
      expect(result.normativeReference).toContain('API 570');
      expect(result.normativeReference).toContain('API 510');
      expect(result.normativeReference).toContain('NR-13');
    });

    it('should calculate with historical data (regression)', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
        historicalData: [
          { date: new Date('2020-01-15'), minThicknessMm: 12.5 },
          { date: new Date('2022-01-15'), minThicknessMm: 12.0 },
          { date: new Date('2024-01-15'), minThicknessMm: 11.5 },
        ],
      };
      const result = calculator.calculate(input);

      expect(result.value).toBeDefined();
      if (result.value) {
        expect(result.value.dataPoints).toBe(5); // 3 historical + 2 current
        expect(result.value.confidence).toBe('HIGH'); // >= 3 points
      }
    });

    it('should set confidence based on data points', () => {
      // 2 points only
      const input2: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result2 = calculator.calculate(input2);
      expect(result2.value?.confidence).toBe('LOW');

      // >= 3 points and >= 2 years
      const input3: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 3,
        historicalData: [
          { date: new Date('2020-01-15'), minThicknessMm: 12.5 },
          { date: new Date('2022-01-15'), minThicknessMm: 12.0 },
          { date: new Date('2024-01-15'), minThicknessMm: 11.5 },
        ],
      };
      const result3 = calculator.calculate(input3);
      expect(result3.value?.confidence).toBe('HIGH');
    });

    it('should set criticality based on corrosion rate', () => {
      // High corrosion rate > 5 mm/ano
      const inputHigh: CorrosionRateInput = {
        currentThicknessMm: 7.0,
        previousThicknessMm: 12.0,
        timeIntervalYears: 1.0, // 5 mm/ano
      };
      const resultHigh = calculator.calculate(inputHigh);
      expect(resultHigh.criticality).toBe('HIGH');

      // Medium 1-5 mm/ano
      const inputMed: CorrosionRateInput = {
        currentThicknessMm: 10.0,
        previousThicknessMm: 12.0,
        timeIntervalYears: 1.0, // 2 mm/ano
      };
      const resultMed = calculator.calculate(inputMed);
      expect(resultMed.criticality).toBe('MEDIUM');

      // Low > 0 and <= 1
      const inputLow: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 1.0, // 0.5 mm/ano
      };
      const resultLow = calculator.calculate(inputLow);
      expect(resultLow.criticality).toBe('LOW');

      // Zero/negative (stable or increasing thickness)
      const inputZero: CorrosionRateInput = {
        currentThicknessMm: 12.0,
        previousThicknessMm: 12.0,
        timeIntervalYears: 1.0,
      };
      const resultZero = calculator.calculate(inputZero);
      expect(resultZero.criticality).toBe('LOW');
    });

    it('should include metadata with calculationId', () => {
      const input: CorrosionRateInput = {
        currentThicknessMm: 11.5,
        previousThicknessMm: 12.0,
        timeIntervalYears: 2.5,
      };
      const result = calculator.calculate(input);

      expect(result.metadata).toEqual(
        expect.objectContaining({
          calculationId: expect.stringMatching(/^cr-\d+$/),
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

CASO 1: Taxa básica 2 pontos
--------------------------------
Input:
  currentThicknessMm: 11.5
  previousThicknessMm: 12.0
  timeIntervalYears: 2.5

Esperado:
  corrosionRateMmPerYear: 0.2
  corrosionRateMpy: 7.87
  confidence: 'LOW'
  dataPoints: 2
  trend: 'INCREASING'
  criticality: 'LOW'

CASO 2: Regressão linear 3+ pontos
----------------------------------
Input com historicalData:
  2020-01-15: 12.5
  2022-01-15: 12.0
  2024-01-15: 11.5

Esperado:
  dataPoints: 5
  confidence: 'HIGH'
  (slope da regressão deve ser ~ -0.25 mm/ano)

CASO 3: Intervalo curto (warning)
---------------------------------
timeIntervalYears: 0.3
Warning: SHORT_INTERVAL

CASO 3: Espessura aumentou (warning)
------------------------------------
currentThicknessMm: 12.5 > previousThicknessMm: 12.0
Warning: THICKNESS_INCREASED

CASO 5: Taxa alta (>5 mm/ano) = CRITICAL
----------------------------------------
currentThicknessMm: 7.0
previousThicknessMm: 12.0
timeIntervalYears: 1.0
criticality: 'HIGH'

=================================================================
*/