/**
 * Engineering Engine - Sistema de Validação
 * 
 * Valida entradas para cálculos de engenharia.
 * Centraliza todas as regras de validação.
 */

import type {
  CalculationInput,
  EquipmentData,
  InspectionData,
  MeasurementPoint,
  MaterialData,
  OperatingConditions,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '../types';
import { ENGINE_CONFIG } from '../constants';
import { isValidPressureUnit, isValidLengthUnit, isValidTemperatureUnit, type LengthUnit, type PressureUnit, type TemperatureUnit } from '../utils/units';

// ============================================================
// VALIDADORES DE CAMPOS INDIVIDUAIS
// ============================================================

/** Valida espessura em mm */
export function validateThicknessMm(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const { MIN_THICKNESS_MM, MAX_THICKNESS_MM } = ENGINE_CONFIG.VALIDATION;
  
  if (value === undefined || value === null) {
    errors.push({
      field: fieldName,
      code: 'REQUIRED_FIELD',
      message: `${fieldName} é obrigatório`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value < MIN_THICKNESS_MM) {
    errors.push({
      field: fieldName,
      code: 'BELOW_MINIMUM',
      message: `${fieldName} (${value} mm) está abaixo do mínimo permitido (${MIN_THICKNESS_MM} mm)`,
      severity: 'ERROR',
    });
  }
  
  if (value > MAX_THICKNESS_MM) {
    errors.push({
      field: fieldName,
      code: 'ABOVE_MAXIMUM',
      message: `${fieldName} (${value} mm) está acima do máximo permitido (${MAX_THICKNESS_MM} mm)`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

/** Valida pressão em bar */
export function validatePressureBar(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const { MIN_PRESSURE_BAR, MAX_PRESSURE_BAR } = ENGINE_CONFIG.VALIDATION;
  
  if (value === undefined || value === null) {
    errors.push({
      field: fieldName,
      code: 'REQUIRED_FIELD',
      message: `${fieldName} é obrigatório`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value < MIN_PRESSURE_BAR) {
    errors.push({
      field: fieldName,
      code: 'NEGATIVE_PRESSURE',
      message: `${fieldName} não pode ser negativo (${value} bar)`,
      severity: 'ERROR',
    });
  }
  
  if (value > MAX_PRESSURE_BAR) {
    errors.push({
      field: fieldName,
      code: 'ABOVE_MAXIMUM',
      message: `${fieldName} (${value} bar) está acima do máximo permitido (${MAX_PRESSURE_BAR} bar)`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

/** Valida temperatura em °C */
export function validateTemperatureC(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const { MIN_TEMP_C, MAX_TEMP_C } = ENGINE_CONFIG.VALIDATION;
  
  if (value === undefined || value === null) {
    errors.push({
      field: fieldName,
      code: 'REQUIRED_FIELD',
      message: `${fieldName} é obrigatório`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value < MIN_TEMP_C) {
    errors.push({
      field: fieldName,
      code: 'BELOW_MINIMUM_TEMP',
      message: `${fieldName} (${value}°C) está abaixo do mínimo permitido (${MIN_TEMP_C}°C)`,
      severity: 'ERROR',
    });
  }
  
  if (value > MAX_TEMP_C) {
    errors.push({
      field: fieldName,
      code: 'ABOVE_MAXIMUM_TEMP',
      message: `${fieldName} (${value}°C) está acima do máximo permitido (${MAX_TEMP_C}°C)`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

/** Valida tempo de operação em anos */
export function validateOperatingTimeYears(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const { MIN_OPERATING_TIME_YEARS, MAX_OPERATING_TIME_YEARS } = ENGINE_CONFIG.VALIDATION;
  
  if (value === undefined || value === null) {
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value < MIN_OPERATING_TIME_YEARS) {
    errors.push({
      field: fieldName,
      code: 'NEGATIVE_TIME',
      message: `${fieldName} não pode ser negativo`,
      severity: 'ERROR',
    });
  }
  
  if (value > MAX_OPERATING_TIME_YEARS) {
    errors.push({
      field: fieldName,
      code: 'ABOVE_MAXIMUM_TIME',
      message: `${fieldName} (${value} anos) parece irrealisticamente alto`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

/** Valida eficiência de junta (0 < E <= 1) */
export function validateJointEfficiency(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (value === undefined || value === null) {
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value <= 0 || value > 1) {
    errors.push({
      field: fieldName,
      code: 'INVALID_EFFICIENCY',
      message: `${fieldName} deve estar entre 0 e 1 (valor: ${value})`,
      severity: 'ERROR',
    });
  }
  
  const commonValues = [1.0, 0.85, 0.7];
  if (!commonValues.includes(value)) {
    errors.push({
      field: fieldName,
      code: 'UNCOMMON_EFFICIENCY',
      message: `${fieldName} (${value}) não é um valor padrão (esperado: 1.0, 0.85 ou 0.7)`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

/** Valida sobre-espessura de corrosão */
export function validateCorrosionAllowance(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (value === undefined || value === null) {
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value < 0) {
    errors.push({
      field: fieldName,
      code: 'NEGATIVE_ALLOWANCE',
      message: `${fieldName} não pode ser negativo`,
      severity: 'ERROR',
    });
  }
  
  if (value > 50) {
    errors.push({
      field: fieldName,
      code: 'EXCESSIVE_ALLOWANCE',
      message: `${fieldName} (${value} mm) parece excessivamente alto`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

/** Valida coeficiente de segurança */
export function validateSafetyFactor(value: number, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (value === undefined || value === null) {
    return errors;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push({
      field: fieldName,
      code: 'INVALID_NUMBER',
      message: `${fieldName} deve ser um número válido`,
      severity: 'ERROR',
    });
    return errors;
  }
  
  if (value < 1.0) {
    errors.push({
      field: fieldName,
      code: 'INVALID_SAFETY_FACTOR',
      message: `${fieldName} deve ser >= 1.0 (valor: ${value})`,
      severity: 'ERROR',
    });
  }
  
  if (value > 5.0) {
    errors.push({
      field: fieldName,
      code: 'EXCESSIVE_SAFETY_FACTOR',
      message: `${fieldName} (${value}) parece excessivamente alto`,
      severity: 'ERROR',
    });
  }
  
  return errors;
}

// ============================================================
// VALIDADORES DE OBJETOS COMPLETOS
// ============================================================

/** Valida EquipmentData */
export function validateEquipmentData(equipment: EquipmentData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  
  if (!equipment.id) missingFields.push('id');
  if (!equipment.tag) missingFields.push('tag');
  if (!equipment.type) missingFields.push('type');
  
  if (equipment.originalThicknessMm === undefined || equipment.originalThicknessMm === null) {
    missingFields.push('originalThicknessMm');
  } else {
    errors.push(...validateThicknessMm(equipment.originalThicknessMm, 'originalThicknessMm'));
  }
  
  if (equipment.minThicknessMm === undefined || equipment.minThicknessMm === null) {
    missingFields.push('minThicknessMm');
  } else {
    errors.push(...validateThicknessMm(equipment.minThicknessMm, 'minThicknessMm'));
  }
  
  if (equipment.designPressureBar === undefined || equipment.designPressureBar === null) {
    missingFields.push('designPressureBar');
  } else {
    errors.push(...validatePressureBar(equipment.designPressureBar, 'designPressureBar'));
  }
  
  if (equipment.originalThicknessMm && equipment.minThicknessMm) {
    if (equipment.minThicknessMm >= equipment.originalThicknessMm) {
      errors.push({
        field: 'minThicknessMm',
        code: 'INCONSISTENT_THICKNESS',
        message: `Espessura mínima (${equipment.minThicknessMm} mm) deve ser menor que a original (${equipment.originalThicknessMm} mm)`,
        severity: 'ERROR',
      });
    }
    
    if (equipment.minThicknessMm < 2.5) {
      warnings.push({
        field: 'minThicknessMm',
        code: 'BELOW_BUSINESS_RULE_MIN',
        message: `Espessura mínima (${equipment.minThicknessMm} mm) está abaixo da regra de negócio (2.5 mm)`,
        suggestion: 'Confirmar com engenheiro responsável se este valor está correto',
      });
    }
  }
  
  if (equipment.designTempC !== undefined) {
    errors.push(...validateTemperatureC(equipment.designTempC, 'designTempC'));
  }
  
  if (equipment.operatingPressureBar !== undefined) {
    errors.push(...validatePressureBar(equipment.operatingPressureBar, 'operatingPressureBar'));
  }
  
  if (equipment.operatingTempC !== undefined) {
    errors.push(...validateTemperatureC(equipment.operatingTempC, 'operatingTempC'));
  }
  
  if (equipment.mawpBar !== undefined) {
    errors.push(...validatePressureBar(equipment.mawpBar, 'mawpBar'));
  }
  
  if (equipment.hydroTestPressureBar !== undefined) {
    errors.push(...validatePressureBar(equipment.hydroTestPressureBar, 'hydroTestPressureBar'));
  }
  
  if (equipment.jointEfficiency !== undefined) {
    errors.push(...validateJointEfficiency(equipment.jointEfficiency, 'jointEfficiency'));
  }
  
  if (equipment.corrosionAllowanceMm !== undefined) {
    errors.push(...validateCorrosionAllowance(equipment.corrosionAllowanceMm, 'corrosionAllowanceMm'));
  }
  
  if (equipment.operatingPressureBar !== undefined && equipment.designPressureBar !== undefined) {
    if (equipment.operatingPressureBar > equipment.designPressureBar) {
      errors.push({
        field: 'operatingPressureBar',
        code: 'OPERATING_ABOVE_DESIGN',
        message: `Pressão de operação (${equipment.operatingPressureBar} bar) excede pressão de projeto (${equipment.designPressureBar} bar)`,
        severity: 'ERROR',
      });
    }
  }
  
  if (equipment.mawpBar !== undefined && equipment.designPressureBar !== undefined) {
    if (equipment.mawpBar > equipment.designPressureBar) {
      warnings.push({
        field: 'mawpBar',
        code: 'MAWP_ABOVE_DESIGN',
        message: `PMTA (${equipment.mawpBar} bar) excede pressão de projeto (${equipment.designPressureBar} bar)`,
        suggestion: 'Verificar se MAWP está correto - normalmente MAWP <= Pressão de Projeto',
      });
    }
  }
  
  return {
    isValid: errors.filter(e => e.severity === 'ERROR').length === 0 && missingFields.length === 0,
    errors,
    warnings,
    missingFields,
  };
}

/** Valida InspectionData */
export function validateInspectionData(inspection: InspectionData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  
  if (!inspection.id) missingFields.push('id');
  if (!inspection.equipmentId) missingFields.push('equipmentId');
  if (!inspection.inspectorId) missingFields.push('inspectorId');
  if (!inspection.status) missingFields.push('status');
  if (!inspection.startedAt) missingFields.push('startedAt');
  if (!inspection.type) missingFields.push('type');
  
  if (inspection.status === 'AGUARDANDO_APROVACAO' || inspection.status === 'APROVADA' || inspection.status === 'REJEITADA') {
    if (!inspection.completedAt) {
      missingFields.push('completedAt');
    }
  }
  
  if (inspection.status === 'APROVADA' || inspection.status === 'REJEITADA') {
    if (!inspection.approvedAt) missingFields.push('approvedAt');
    if (!inspection.approvedById) missingFields.push('approvedById');
  }
  
  if (inspection.status === 'REJEITADA' && !inspection.rejectionReason) {
    missingFields.push('rejectionReason');
  }
  
  return {
    isValid: errors.length === 0 && missingFields.length === 0,
    errors,
    warnings,
    missingFields,
  };
}

/** Valida MeasurementPoint */
export function validateMeasurementPoint(measurement: MeasurementPoint): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  
  if (!measurement.id) missingFields.push('id');
  if (!measurement.inspectionId) missingFields.push('inspectionId');
  if (!measurement.point || measurement.point.trim() === '') missingFields.push('point');
  
  if (measurement.thicknessMm === undefined || measurement.thicknessMm === null) {
    missingFields.push('thicknessMm');
  } else {
    errors.push(...validateThicknessMm(measurement.thicknessMm, 'thicknessMm'));
  }
  
  if (measurement.angleDeg !== undefined) {
    if (typeof measurement.angleDeg !== 'number' || isNaN(measurement.angleDeg)) {
      errors.push({
        field: 'angleDeg',
        code: 'INVALID_NUMBER',
        message: 'Ângulo deve ser um número válido',
        severity: 'ERROR',
      });
    } else if (measurement.angleDeg < 0 || measurement.angleDeg > 360) {
      errors.push({
        field: 'angleDeg',
        code: 'INVALID_ANGLE',
        message: `Ângulo deve estar entre 0 e 360 graus (valor: ${measurement.angleDeg})`,
        severity: 'ERROR',
      });
    }
  }
  
  return {
    isValid: errors.length === 0 && missingFields.length === 0,
    errors,
    warnings,
    missingFields,
  };
}

/** Valida array de MeasurementPoint */
export function validateMeasurements(measurements: MeasurementPoint[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  
  if (!measurements || measurements.length === 0) {
    warnings.push({
      field: 'measurements',
      code: 'NO_MEASUREMENTS',
      message: 'Nenhuma medição fornecida - cálculos de espessura mínima não serão possíveis',
      suggestion: 'Adicionar pontos de medição por ultrassom',
    });
    return { isValid: true, errors, warnings, missingFields };
  }
  
  const pointMap = new Map<string, number>();
  measurements.forEach((m, idx) => {
    const count = pointMap.get(m.point) || 0;
    pointMap.set(m.point, count + 1);
    if (count > 0) {
      errors.push({
        field: `measurements[${idx}].point`,
        code: 'DUPLICATE_POINT',
        message: `Ponto duplicado: ${m.point}`,
        severity: 'ERROR',
      });
    }
  });
  
  measurements.forEach((m, idx) => {
    const result = validateMeasurementPoint(m);
    errors.push(...result.errors.map(e => ({ ...e, field: `measurements[${idx}].${e.field}` })));
    warnings.push(...result.warnings.map(w => ({ ...w, field: `measurements[${idx}].${w.field}` })));
    missingFields.push(...result.missingFields.map(f => `measurements[${idx}].${f}`));
  });
  
  return {
    isValid: errors.filter(e => e.severity === 'ERROR').length === 0,
    errors,
    warnings,
    missingFields,
  };
}

/** Valida CalculationInput completo */
export function validateCalculationInput(input: CalculationInput): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const missingFields: string[] = [];
  
  if (!input.equipment) {
    errors.push({
      field: 'equipment',
      code: 'REQUIRED_FIELD',
      message: 'Dados do equipamento são obrigatórios',
      severity: 'CRITICAL',
    });
  } else {
    const equipResult = validateEquipmentData(input.equipment);
    errors.push(...equipResult.errors);
    warnings.push(...equipResult.warnings);
    missingFields.push(...equipResult.missingFields);
  }
  
  if (!input.inspection) {
    errors.push({
      field: 'inspection',
      code: 'REQUIRED_FIELD',
      message: 'Dados da inspeção são obrigatórios',
      severity: 'CRITICAL',
    });
  } else {
    const inspResult = validateInspectionData(input.inspection);
    errors.push(...inspResult.errors);
    warnings.push(...inspResult.warnings);
    missingFields.push(...inspResult.missingFields);
  }
  
  if (!input.measurements || input.measurements.length === 0) {
    warnings.push({
      field: 'measurements',
      code: 'NO_MEASUREMENTS',
      message: 'Sem medições - apenas cálculos teóricos serão possíveis',
      suggestion: 'Adicionar medições de ultrassom para resultados reais',
    });
  } else {
    const measResult = validateMeasurements(input.measurements);
    errors.push(...measResult.errors);
    warnings.push(...measResult.warnings);
    missingFields.push(...measResult.missingFields);
  }
  
  if (input.corrosionRateMmPerYear !== undefined) {
    if (typeof input.corrosionRateMmPerYear !== 'number' || isNaN(input.corrosionRateMmPerYear)) {
      errors.push({
        field: 'corrosionRateMmPerYear',
        code: 'INVALID_NUMBER',
        message: 'Taxa de corrosão deve ser um número válido',
        severity: 'ERROR',
      });
    } else if (input.corrosionRateMmPerYear < 0) {
      errors.push({
        field: 'corrosionRateMmPerYear',
        code: 'NEGATIVE_CORROSION_RATE',
        message: 'Taxa de corrosão não pode ser negativa',
        severity: 'ERROR',
      });
    } else if (input.corrosionRateMmPerYear > 10) {
      warnings.push({
        field: 'corrosionRateMmPerYear',
        code: 'HIGH_CORROSION_RATE',
        message: `Taxa de corrosão muito alta (${input.corrosionRateMmPerYear} mm/ano)`,
        suggestion: 'Verificar se o valor está em mm/ano e não em µm/ano',
      });
    }
  }
  
  if (input.jointEfficiency !== undefined) {
    errors.push(...validateJointEfficiency(input.jointEfficiency, 'jointEfficiency'));
  }
  
  if (input.corrosionAllowanceMm !== undefined) {
    errors.push(...validateCorrosionAllowance(input.corrosionAllowanceMm, 'corrosionAllowanceMm'));
  }
  
  if (input.safetyFactor !== undefined) {
    errors.push(...validateSafetyFactor(input.safetyFactor, 'safetyFactor'));
  }
  
  if (input.previousInspectionDate && input.previousMinThicknessMm) {
    const yearsDiff = (new Date().getTime() - new Date(input.previousInspectionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsDiff < 0.1) {
      warnings.push({
        field: 'previousInspectionDate',
        code: 'RECENT_PREVIOUS_INSPECTION',
        message: `Inspeção anterior muito recente (${yearsDiff.toFixed(1)} anos) - taxa de corrosão pode ser imprecisa`,
      });
    }
  }
  
  return {
    isValid: errors.filter(e => e.severity === 'ERROR' || e.severity === 'CRITICAL').length === 0,
    errors,
    warnings,
    missingFields,
  };
}

/** Valida consistência de unidades */
export function validateUnitConsistency(input: CalculationInput): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  
  const pressureFields = [
    { field: 'equipment.designPressureBar', value: input.equipment?.designPressureBar },
    { field: 'equipment.operatingPressureBar', value: input.equipment?.operatingPressureBar },
    { field: 'equipment.mawpBar', value: input.equipment?.mawpBar },
    { field: 'equipment.hydroTestPressureBar', value: input.equipment?.hydroTestPressureBar },
  ];
  
  pressureFields.forEach(({ field, value }) => {
    if (value !== undefined && typeof value === 'number') {
      if (value > 0 && value < 1 && input.equipment?.designPressureBar && input.equipment.designPressureBar > 10) {
        warnings.push({
          field,
          code: 'POSSIBLE_WRONG_UNIT',
          message: `Valor (${value}) parece estar em MPa, mas o sistema espera bar`,
          suggestion: 'Multiplicar por 10 para converter MPa para bar',
        });
      }
    }
  });
  
  const thicknessFields = [
    { field: 'equipment.originalThicknessMm', value: input.equipment?.originalThicknessMm },
    { field: 'equipment.minThicknessMm', value: input.equipment?.minThicknessMm },
    { field: 'equipment.headNominalThicknessMm', value: input.equipment?.headNominalThicknessMm },
  ];
  
  thicknessFields.forEach(({ field, value }) => {
    if (value !== undefined && typeof value === 'number') {
      if (value > 0 && value < 5 && input.equipment?.originalThicknessMm && input.equipment.originalThicknessMm > 5) {
        warnings.push({
          field,
          code: 'POSSIBLE_WRONG_UNIT',
          message: `Valor (${value}) parece estar em cm, mas o sistema espera mm`,
          suggestion: 'Multiplicar por 10 para converter cm para mm',
        });
      }
      if (value > 0 && value < 1) {
        warnings.push({
          field,
          code: 'POSSIBLE_WRONG_UNIT',
          message: `Valor (${value}) parece estar em polegadas, mas o sistema espera mm`,
          suggestion: 'Multiplicar por 25.4 para converter polegadas para mm',
        });
      }
    }
  });
  
  return warnings;
}