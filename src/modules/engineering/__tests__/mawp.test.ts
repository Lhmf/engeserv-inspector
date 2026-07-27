/**
 * Testes Unitários — MawpCalculator
 * 
 * AGUARDANDO VALORES OFICIAIS DO ENGENHEIRO RESPONSÁVEL
 */

import { MawpCalculator } from '../calculations/mawp';
import type { MawpInput, MawpResult } from '../calculations';

describe('MawpCalculator', () => {
  let calculator: MawpCalculator;

  beforeEach(() => {
    calculator = new MawpCalculator();
  });

  describe('validate()', () => {
    it('should reject missing currentThicknessMm', () => {
      const input: MawpInput = {
        currentThicknessMm: 0,
        insideDiameterMm: 1000,
        jointEfficiency: 1.0,
        allowableStressMpa: 138,
        corrosionAllowanceMm: 3.0,
        designCode: 'ASME_VIII_DIV1',
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('currentThicknessMm');
    });

    it('should reject missing insideDiameterMm', () => {
      const input: MawpInput = {
        currentThicknessMm: 12.0,
        insideDiameterMm: 0,
        jointEfficiency: 1.0,
        allowableStressMpa: 138,
        corrosionAllowanceMm: 3.0,
        designCode: 'ASME_VIII_DIV1',
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('insideDiameterMm');
    });

    it('should reject invalid jointEfficiency (<=0 or >1)', () => {
      const inputs = [
        { ...baseInput(), jointEfficiency: 0 },
        { ...baseInput(), jointEfficiency: -0.1 },
        { ...baseInput(), jointEfficiency: 1.5 },
      ];

      inputs.forEach(input => {
        const result = calculator.validate(input);
        expect(result.isValid).toBe(false);
        expect(result.missingFields).toContain('jointEfficiency');
      });
    });

    it('should warn on uncommon jointEfficiency values', () => {
      const input = { ...baseInput(), jointEfficiency: 0.9 };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'UNCOMMON_EFFICIENCY')).toBe(true);
    });

    it('should reject missing allowableStressMpa', () => {
      const input = { ...baseInput(), allowableStressMpa: 0 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.missingFields).toContain('allowableStressMpa');
    });

    it('should reject negative corrosionAllowanceMm', () => {
      const input = { ...baseInput(), corrosionAllowanceMm: -1 };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'NEGATIVE_ALLOWANCE')).toBe(true);
    });

    it('should warn on excessive corrosionAllowanceMm', () => {
      const input = { ...baseInput(), corrosionAllowanceMm: 100 };
      const result = calculator.validate(input);
      expect(result.warnings.some(w => w.code === 'EXCESSIVE_ALLOWANCE')).toBe(true);
    });

    it('should reject effective thickness <= 0 (CRITICAL)', () => {
      const input = { 
        ...baseInput(), 
        currentThicknessMm: 3.0, 
        corrosionAllowanceMm: 3.0 
      };
      const result = calculator.validate(input);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.severity === 'CRITICAL' && e.code === 'EFFECTIVE_THICKNESS_NEGATIVE')).toBe(true);
    });

    it('should accept valid input', () => {
      const result = calculator.validate(baseInput());
      expect(result.isValid).toBe(true);
    });
  });

  function baseInput(): MawpInput {
    return {
      currentThicknessMm: 12.0,
      insideDiameterMm: 1000,
      jointEfficiency: 1.0,
      allowableStressMpa: 138,
      corrosionAllowanceMm: 3.0,
      designCode: 'ASME_VIII_DIV1',
    };
  }

  describe('calculate()', () => {
    it('should return ERROR for invalid input', () => {
      const input: MawpInput = {
        currentThicknessMm: 3.0,
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

    it('should calculate MAWP for ASME VIII-1 cylindrical shell', () => {
      const input: MawpInput = {
        currentThicknessMm: 12.0,
        insideDiameterMm: 1000,
        jointEfficiency: 1.0,
        allowableStressMpa: 138,
        corrosionAllowanceMm: 3.0,
        designCode: 'ASME_VIII_DIV1',
      };
      const result = calculator.calculate(input);

      expect(result.value).toBeDefined();
      if (result.value) {
        // t_efetiva = 12.0 - 3.0 = 9.0 mm
        // R = 500 mm
        // P = (138 * 1.0 * 9.0) / (500 + 0.6 * 9.0) = 1242 / 505.4 = 2.457 MPa = 24.57 bar
        expect(result.value.mawpMpa).toBeCloseTo(2.46, 1);
        expect(result.value.mawpBar).toBeCloseTo(24.6, 1);
        expect(result.value.governingThicknessMm).toBeCloseTo(9.0, 1);
      }
      expect(result.unit).toBe('bar');
      expect(result.normativeReference).toContain('ASME VIII-1 UG-27');
      expect(result.normativeReference).toContain('NR-13');
    });

    it('should set status to WARNING (placeholder)', () => {
      const result = calculator.calculate(baseInput());
      expect(result.status).toBe('WARNING');
      expect(result.reliability).toBe('THEORETICAL');
    });

    it('should include observations about placeholder', () => {
      const result = calculator.calculate(baseInput());
      expect(result.observations.some(o => o.includes('PLACEHOLDER'))).toBe(true);
      expect(result.observations.some(o => o.includes('NÃO USAR EM PRODUÇÃO'))).toBe(true);
    });

    it('should include metadata', () => {
      const result = calculator.calculate(baseInput());
      expect(result.metadata).toEqual(
        expect.objectContaining({
          calculationId: expect.stringMatching(/^mawp-\d+$/),
          calculatedAt: expect.any(Date),
          formulaVersion: expect.any(String),
          normativeVersion: expect.stringContaining('ASME'),
          inputs: expect.objectContaining(baseInput()),
        })
      );
    });
  });
});

/*
=================================================================
CASOS DE TESTE PARA PREENCHER APÓS VALIDAÇÃO DO ENGENHEIRO
=================================================================

CASO 1: ASME VIII-1 Cilindro (básico)
--------------------------------------
Input:
  currentThicknessMm: 12.0
  insideDiameterMm: 1000
  jointEfficiency: 1.0
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1'

Esperado:
  governingThicknessMm: 9.0 (12 - 3)
  mawpMpa: ~2.46
  mawpBar: ~24.6
  formulaUsed: 'P = (S * E * t) / (R + 0.6 * t)'

CASO 2: ASME VIII-1 Cilindro (E = 0.85)
----------------------------------------
Input:
  currentThicknessMm: 12.0
  insideDiameterMm: 1000
  jointEfficiency: 0.85
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1'

Esperado:
  mawpBar: ~20.9 (0.85 * 24.6)

CASO 3: ASME VIII-1 Esférico
-----------------------------
Input:
  currentThicknessMm: 12.0
  insideDiameterMm: 1000
  jointEfficiency: 1.0
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1' (ou específico para esférico)

Esperado:
  P = (2 * S * E * t) / (R - 0.4 * t)
  mawpBar: ~49.2 (aprox 2x o cilindro)

CASO 4: ASME VIII-1 Tampo Elipsoidal
-------------------------------------
Input:
  currentThicknessMm: 10.0
  insideDiameterMm: 1000
  jointEfficiency: 1.0
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1' (cabeçalho deve diferenciar)

Esperado:
  P = (2 * S * E * t) / (D - 0.2 * t)
  mawpBar: ~24.7

CASO 5: ASME VIII-1 Tampo Torisférico
--------------------------------------
Input:
  currentThicknessMm: 10.0
  insideDiameterMm: 1000
  jointEfficiency: 1.0
  allowableStressMpa: 138
  corrosionAllowanceMm: 3.0
  designCode: 'ASME_VIII_DIV1' (precisa saber M = fator de forma)

Esperado:
  P = (2 * S * E * t) / (M * D - 0.2 * t)
  M = fator de forma (depende da geometria do torisférico)

CASO 6: API 650 (Tanque atmosférico)
-------------------------------------
Input:
  currentThicknessMm: 8.0
  insideDiameterMm: 5000
  jointEfficiency: 0.85
  allowableStressMpa: 138
  corrosionAllowanceMm: 1.5
  designCode: 'API_650'

Esperado:
  P = (2 * S * E * t) / D (para tanque atmosférico, pressão muito baixa)
  Pressão de projeto tipicamente em kPa/mbar, não bar

CASO 6: Espessura efetiva negativa (ERROR)
------------------------------------------
Input:
  currentThicknessMm: 3.0
  corrosionAllowanceMm: 3.0

Esperado:
  status: 'ERROR'
  criticality: 'CRITICAL'
  observations: contém 'Espessura efetiva... zero ou negativa'

CASO 7: Valores incomuns de E (WARNING)
----------------------------------------
Input:
  jointEfficiency: 0.9

Esperado:
  warnings: contém 'UNCOMMON_EFFICIENCY'

=================================================================
*/