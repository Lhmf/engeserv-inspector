/**
 * Engineering Engine - Módulo de Unidades e Conversões
 * 
 * Centraliza TODAS as conversões de unidades do sistema.
 * NUNCA espalhar conversões pelo código - usar apenas este módulo.
 */

// ============================================================
// TIPOS
// ============================================================

export type PressureUnit = 'bar' | 'MPa' | 'psi' | 'kgf/cm2' | 'kPa';
export type LengthUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';
export type TemperatureUnit = 'C' | 'F' | 'K';
export type VolumeUnit = 'L' | 'm3' | 'gal' | 'ft3';
export type StressUnit = 'MPa' | 'psi' | 'kgf/cm2' | 'kPa';

export interface UnitDefinition {
  unit: string;
  system: 'METRIC' | 'IMPERIAL';
  baseUnit: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

// ============================================================
// DEFINIÇÕES DE UNIDADES
// ============================================================

export const PRESSURE_UNITS: Record<PressureUnit, UnitDefinition> = {
  bar: {
    unit: 'bar',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.1,
    fromBase: (v) => v * 10,
  },
  MPa: {
    unit: 'MPa',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  psi: {
    unit: 'psi',
    system: 'IMPERIAL',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.00689476,
    fromBase: (v) => v / 0.00689476,
  },
  'kgf/cm2': {
    unit: 'kgf/cm²',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.0980665,
    fromBase: (v) => v / 0.0980665,
  },
  kPa: {
    unit: 'kPa',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000,
  },
};

export const LENGTH_UNITS: Record<LengthUnit, UnitDefinition> = {
  mm: {
    unit: 'mm',
    system: 'METRIC',
    baseUnit: 'mm',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  cm: {
    unit: 'cm',
    system: 'METRIC',
    baseUnit: 'mm',
    toBase: (v) => v * 10,
    fromBase: (v) => v / 10,
  },
  m: {
    unit: 'm',
    system: 'METRIC',
    baseUnit: 'mm',
    toBase: (v) => v * 1000,
    fromBase: (v) => v / 1000,
  },
  in: {
    unit: 'in',
    system: 'IMPERIAL',
    baseUnit: 'mm',
    toBase: (v) => v * 25.4,
    fromBase: (v) => v / 25.4,
  },
  ft: {
    unit: 'ft',
    system: 'IMPERIAL',
    baseUnit: 'mm',
    toBase: (v) => v * 304.8,
    fromBase: (v) => v / 304.8,
  },
};

export const TEMPERATURE_UNITS: Record<TemperatureUnit, UnitDefinition> = {
  C: {
    unit: '°C',
    system: 'METRIC',
    baseUnit: 'K',
    toBase: (v) => v + 273.15,
    fromBase: (v) => v - 273.15,
  },
  F: {
    unit: '°F',
    system: 'IMPERIAL',
    baseUnit: 'K',
    toBase: (v) => (v + 459.67) * 5/9,
    fromBase: (v) => v * 9/5 - 459.67,
  },
  K: {
    unit: 'K',
    system: 'METRIC',
    baseUnit: 'K',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
};

export const VOLUME_UNITS: Record<VolumeUnit, UnitDefinition> = {
  L: {
    unit: 'L',
    system: 'METRIC',
    baseUnit: 'm3',
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000,
  },
  m3: {
    unit: 'm³',
    system: 'METRIC',
    baseUnit: 'm3',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  gal: {
    unit: 'gal',
    system: 'IMPERIAL',
    baseUnit: 'm3',
    toBase: (v) => v * 0.00378541,
    fromBase: (v) => v / 0.00378541,
  },
  ft3: {
    unit: 'ft³',
    system: 'IMPERIAL',
    baseUnit: 'm3',
    toBase: (v) => v * 0.0283168,
    fromBase: (v) => v / 0.0283168,
  },
};

export const STRESS_UNITS: Record<StressUnit, UnitDefinition> = {
  MPa: {
    unit: 'MPa',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  psi: {
    unit: 'psi',
    system: 'IMPERIAL',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.00689476,
    fromBase: (v) => v / 0.00689476,
  },
  'kgf/cm2': {
    unit: 'kgf/cm²',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.0980665,
    fromBase: (v) => v / 0.0980665,
  },
  kPa: {
    unit: 'kPa',
    system: 'METRIC',
    baseUnit: 'MPa',
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000,
  },
};

// ============================================================
// FUNÇÕES DE CONVERSÃO GENÉRICAS
// ============================================================

export function convertPressure(
  value: number,
  from: PressureUnit,
  to: PressureUnit
): number {
  const fromDef = PRESSURE_UNITS[from];
  const toDef = PRESSURE_UNITS[to];
  
  if (!fromDef || !toDef) {
    throw new Error(`Unidade de pressão inválida: ${from} -> ${to}`);
  }
  
  const baseValue = fromDef.toBase(value);
  return toDef.fromBase(baseValue);
}

export function convertLength(
  value: number,
  from: LengthUnit,
  to: LengthUnit
): number {
  const fromDef = LENGTH_UNITS[from];
  const toDef = LENGTH_UNITS[to];
  
  if (!fromDef || !toDef) {
    throw new Error(`Unidade de comprimento inválida: ${from} -> ${to}`);
  }
  
  const baseValue = fromDef.toBase(value);
  return toDef.fromBase(baseValue);
}

export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): number {
  const fromDef = TEMPERATURE_UNITS[from];
  const toDef = TEMPERATURE_UNITS[to];
  
  if (!fromDef || !toDef) {
    throw new Error(`Unidade de temperatura inválida: ${from} -> ${to}`);
  }
  
  const baseValue = fromDef.toBase(value);
  return toDef.fromBase(baseValue);
}

export function convertVolume(
  value: number,
  from: VolumeUnit,
  to: VolumeUnit
): number {
  const fromDef = VOLUME_UNITS[from];
  const toDef = VOLUME_UNITS[to];
  
  if (!fromDef || !toDef) {
    throw new Error(`Unidade de volume inválida: ${from} -> ${to}`);
  }
  
  const baseValue = fromDef.toBase(value);
  return toDef.fromBase(baseValue);
}

export function convertStress(
  value: number,
  from: StressUnit,
  to: StressUnit
): number {
  const fromDef = STRESS_UNITS[from];
  const toDef = STRESS_UNITS[to];
  
  if (!fromDef || !toDef) {
    throw new Error(`Unidade de tensão inválida: ${from} -> ${to}`);
  }
  
  const baseValue = fromDef.toBase(value);
  return toDef.fromBase(baseValue);
}

// ============================================================
// FUNÇÕES DE CONVENIÊNCIA (USO COMUM NO SISTEMA)
// ============================================================

/** Converte pressão para bar (unidade padrão do sistema) */
export function toBar(value: number, from: PressureUnit): number {
  return convertPressure(value, from, 'bar');
}

/** Converte pressão de bar para outra unidade */
export function fromBar(value: number, to: PressureUnit): number {
  return convertPressure(value, 'bar', to);
}

/** Converte espessura para mm (unidade padrão do sistema) */
export function toMm(value: number, from: LengthUnit): number {
  return convertLength(value, from, 'mm');
}

/** Converte espessura de mm para outra unidade */
export function fromMm(value: number, to: LengthUnit): number {
  return convertLength(value, 'mm', to);
}

/** Converte temperatura para °C (unidade padrão do sistema) */
export function toCelsius(value: number, from: TemperatureUnit): number {
  return convertTemperature(value, from, 'C');
}

/** Converte temperatura de °C para outra unidade */
export function fromCelsius(value: number, to: TemperatureUnit): number {
  return convertTemperature(value, 'C', to);
}

/** Converte volume para litros (unidade padrão do sistema) */
export function toLiters(value: number, from: VolumeUnit): number {
  return convertVolume(value, from, 'L');
}

/** Converte volume de litros para outra unidade */
export function fromLiters(value: number, to: VolumeUnit): number {
  return convertVolume(value, 'L', to);
}

/** Converte tensão para MPa (unidade padrão do sistema) */
export function toMpa(value: number, from: StressUnit): number {
  return convertStress(value, from, 'MPa');
}

/** Converte tensão de MPa para outra unidade */
export function fromMpa(value: number, to: StressUnit): number {
  return convertStress(value, 'MPa', to);
}

// ============================================================
// FORMATAÇÃO PARA EXIBIÇÃO
// ============================================================

export function formatPressure(value: number, unit: PressureUnit = 'bar', decimals = 2): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

export function formatLength(value: number, unit: LengthUnit = 'mm', decimals = 2): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

export function formatTemperature(value: number, unit: TemperatureUnit = 'C', decimals = 1): string {
  return `${value.toFixed(decimals)}°${unit === 'K' ? 'K' : unit}`;
}

export function formatVolume(value: number, unit: VolumeUnit = 'L', decimals = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

export function formatStress(value: number, unit: StressUnit = 'MPa', decimals = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

// ============================================================
// VALIDAÇÃO DE UNIDADES
// ============================================================

export function isValidPressureUnit(unit: string): unit is PressureUnit {
  return unit in PRESSURE_UNITS;
}

export function isValidLengthUnit(unit: string): unit is LengthUnit {
  return unit in LENGTH_UNITS;
}

export function isValidTemperatureUnit(unit: string): unit is TemperatureUnit {
  return unit in TEMPERATURE_UNITS;
}

export function isValidVolumeUnit(unit: string): unit is VolumeUnit {
  return unit in VOLUME_UNITS;
}

export function isValidStressUnit(unit: string): unit is StressUnit {
  return unit in STRESS_UNITS;
}