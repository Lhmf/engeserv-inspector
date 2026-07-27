/**
 * Engineering Engine - Constantes e Configurações
 * 
 * Centraliza todas as constantes, configurações e valores de referência
 * usados nos cálculos de engenharia.
 * 
 * IMPORTANTE: Valores técnicos definitivos DEVEM ser validados pelo engenheiro
 * responsável antes de serem usados em produção. Este arquivo contém apenas
 * a estrutura e valores placeholder.
 */

// ============================================================
// VERSÕES E CONFIGURAÇÃO
// ============================================================

export const ENGINEERING_ENGINE_VERSION = '1.0.0';
export const ENGINEERING_ENGINE_BUILD_DATE = new Date().toISOString();

export const NORMATIVE_VERSIONS = {
  NR13: '2023',              // NR-13 versão atual
  ASME_BPV: '2021',          // ASME Boiler and Pressure Vessel Code
  ASME_B31_3: '2020',        // ASME B31.3 Process Piping
  API_510: '2020',           // API 510 Pressure Vessel Inspection
  API_570: '2016',           // API 570 Piping Inspection
  API_653: '2014',           // API 653 Tank Inspection
} as const;

export type NormativeStandard = keyof typeof NORMATIVE_VERSIONS;

// ============================================================
// LIMITES E THRESHOLDS (PLACEHOLDERS - VALIDAR COM ENGENHEIRO)
// ============================================================

/**
 * Configurações de thresholds para status de espessura
 * VALORES DEVEM SER CONFIRMADOS COM ENGENHEIRO RESPONSÁVEL
 */
export const THICKNESS_THRESHOLDS = {
  // Margem mínima absoluta (regra de negócio informada: > 2.5mm)
  ABSOLUTE_MIN_THICKNESS_MM: 2.5,
  
  // Percentuais para classificação de criticidade
  CRITICAL_THRESHOLD_PERCENT: 100,    // <= 100% da espessura mínima = CRÍTICO
  WARNING_THRESHOLD_PERCENT: 120,     // <= 120% da espessura mínima = ATENÇÃO
  // > 120% = OK
  
  // Margem de segurança padrão para cálculos
  DEFAULT_SAFETY_FACTOR: 1.5,
  
  // Sobre-espessura de corrosão padrão (mm) - por tipo de equipamento
  DEFAULT_CORROSION_ALLOWANCE_MM: {
    CALDEIRA: 3.0,
    VASO_DE_PRESSAO: 3.0,
    TANQUE: 2.0,
    TUBULACAO: 1.5,
    SILO: 1.0,
    COMPRESSOR: 2.0,
    TROCADOR_DE_CALOR: 2.0,
    REATOR: 3.0,
    OUTRO: 2.0,
  } as Record<string, number>,
  
  // Eficiência de junta padrão (quando não especificada)
  DEFAULT_JOINT_EFFICIENCY: 1.0,  // 1.0 = radiografado 100%
  
  // Intervalos de inspeção padrão (meses)
  DEFAULT_INSPECTION_INTERVALS_MONTHS: {
    CALDEIRA: 12,
    VASO_DE_PRESSAO: 24,
    TANQUE: 60,
    TUBULACAO: 48,
    SILO: 24,
    COMPRESSOR: 12,
    TROCADOR_DE_CALOR: 24,
    REATOR: 24,
    OUTRO: 24,
  } as Record<string, number>,
} as const;

// ============================================================
// UNIDADES DE MEDIDA E CONVERSÕES
// ============================================================

export const UNIT_CONVERSIONS = {
  // Pressão
  PRESSURE: {
    BAR_TO_MPA: 0.1,
    MPA_TO_BAR: 10,
    BAR_TO_PSI: 14.5038,
    PSI_TO_BAR: 0.0689476,
    BAR_TO_KGF_CM2: 1.01972,
    KGF_CM2_TO_BAR: 0.980665,
    MPA_TO_KGF_CM2: 10.1972,
    KGF_CM2_TO_MPA: 0.0980665,
  },
  
  // Comprimento/Espessura
  LENGTH: {
    MM_TO_CM: 0.1,
    CM_TO_MM: 10,
    MM_TO_M: 0.001,
    M_TO_MM: 1000,
    MM_TO_INCH: 0.0393701,
    INCH_TO_MM: 25.4,
  },
  
  // Temperatura
  TEMPERATURE: {
    C_TO_F: (c: number) => (c * 9/5) + 32,
    F_TO_C: (f: number) => (f - 32) * 5/9,
    C_TO_K: (c: number) => c + 273.15,
    K_TO_C: (k: number) => k - 273.15,
  },
  
  // Volume
  VOLUME: {
    L_TO_M3: 0.001,
    M3_TO_L: 1000,
  },
} as const;

// ============================================================
// MATERIAIS DE REFERÊNCIA (PLACEHOLDERS - VALIDAR COM ENGENHEIRO)
// ============================================================

export interface MaterialReference {
  name: string;
  specification: string;
  grade?: string;
  minYieldStrengthMpa: number;    // Sy - Limite de escoamento mínimo
  minTensileStrengthMpa: number;  // Su - Resistência à tração mínima
  // Tensões admissíveis por temperatura (S) - valores em MPa
  // Índice = temperatura em °C (aproximado)
  allowableStressByTempMpa: Record<number, number>;
}

export const MATERIAL_REFERENCES: Record<string, MaterialReference> = {
  // Aços carbono comuns para vasos de pressão
  'SA-516_GR70': {
    name: 'SA-516 Gr.70',
    specification: 'ASME SA-516',
    grade: '70',
    minYieldStrengthMpa: 260,
    minTensileStrengthMpa: 485,
    allowableStressByTempMpa: {
      50: 138,
      100: 138,
      150: 133,
      200: 125,
      250: 116,
      300: 106,
      350: 98,
      400: 93,
    },
  },
  'SA-516_GR60': {
    name: 'SA-516 Gr.60',
    specification: 'ASME SA-516',
    grade: '60',
    minYieldStrengthMpa: 220,
    minTensileStrengthMpa: 415,
    allowableStressByTempMpa: {
      50: 117,
      100: 117,
      150: 113,
      200: 106,
      250: 99,
      300: 91,
      350: 84,
      400: 79,
    },
  },
  'SA-36': {
    name: 'SA-36',
    specification: 'ASME SA-36',
    minYieldStrengthMpa: 250,
    minTensileStrengthMpa: 400,
    allowableStressByTempMpa: {
      50: 115,
      100: 115,
      150: 112,
      200: 107,
      250: 102,
      300: 96,
      350: 90,
      400: 86,
    },
  },
  'SA-240_316L': {
    name: 'SA-240 316L',
    specification: 'ASME SA-240',
    grade: '316L',
    minYieldStrengthMpa: 170,
    minTensileStrengthMpa: 485,
    allowableStressByTempMpa: {
      50: 115,
      100: 115,
      150: 108,
      200: 101,
      250: 94,
      300: 88,
      350: 83,
      400: 79,
    },
  },
  'SA-240_304L': {
    name: 'SA-240 304L',
    specification: 'ASME SA-240',
    grade: '304L',
    minYieldStrengthMpa: 170,
    minTensileStrengthMpa: 485,
    allowableStressByTempMpa: {
      50: 115,
      100: 115,
      150: 105,
      200: 97,
      250: 90,
      300: 84,
      350: 79,
      400: 75,
    },
  },
  // API 650 - Tanques atmosféricos
  'A-36': {
    name: 'A-36',
    specification: 'ASTM A-36',
    minYieldStrengthMpa: 250,
    minTensileStrengthMpa: 400,
    allowableStressByTempMpa: {
      50: 115,
      100: 115,
      150: 112,
      200: 107,
    },
  },
} as const;

// ============================================================
// CLASSES DE FLUIDO E GRUPOS DE RISCO (NR-13)
// ============================================================

export const FLUID_CLASSES = {
  A: { 
    description: 'Fluidos extremamente perigosos',
    examples: ['Gases tóxicos', 'Inflamáveis de alta periculosidade'],
    inspectionPriority: 'MAXIMA',
  },
  B: { 
    description: 'Fluidos perigosos',
    examples: ['Vapor saturado/superaquecido', 'Gases inflamáveis', 'Líquidos inflamáveis'],
    inspectionPriority: 'ALTA',
  },
  C: { 
    description: 'Fluidos pouco perigosos',
    examples: ['Ar comprimido', 'Gases inertes', 'Água quente > 120°C'],
    inspectionPriority: 'MEDIA',
  },
  D: { 
    description: 'Fluidos não perigosos',
    examples: ['Água fria', 'Ar em baixa pressão', 'Líquidos não perigosos'],
    inspectionPriority: 'BAIXA',
  },
} as const;

export const RISK_GROUPS = {
  1: { description: 'Baixo potencial de risco', inspectionIntervalMonths: 60 },
  2: { description: 'Médio potencial de risco', inspectionIntervalMonths: 24 },
  3: { description: 'Alto potencial de risco', inspectionIntervalMonths: 12 },
  4: { description: 'Muito alto potencial de risco', inspectionIntervalMonths: 6 },
} as const;

export const NR13_CATEGORIES = {
  I: { description: 'Categoria I - Menor risco', maxVolumeLiters: 1000, maxPressureBar: 10 },
  II: { description: 'Categoria II', maxVolumeLiters: 10000, maxPressureBar: 50 },
  III: { description: 'Categoria III', maxVolumeLiters: 50000, maxPressureBar: 100 },
  IV: { description: 'Categoria IV', maxVolumeLiters: 100000, maxPressureBar: 200 },
  V: { description: 'Categoria V - Maior risco', maxVolumeLiters: Infinity, maxPressureBar: Infinity },
} as const;

// ============================================================
// TIPOS DE EQUIPAMENTO E CÓDIGOS DE PROJETO
// ============================================================

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  CALDEIRA: 'Caldeira',
  VASO_DE_PRESSAO: 'Vaso de Pressão',
  SILO: 'Silo',
  TANQUE: 'Tanque',
  TUBULACAO: 'Tubulação',
  COMPRESSOR: 'Compressor',
  TROCADOR_DE_CALOR: 'Trocador de Calor',
  REATOR: 'Reator',
  OUTRO: 'Outro',
};

export const DESIGN_CODES = [
  'ASME SEC.I / 2021',
  'ASME SEC.VIII Div.1 / 2021',
  'ASME SEC.VIII Div.2 / 2021',
  'ASME B31.3 / 2020',
  'API 650 / 2020',
  'API 620 / 2020',
  'NR-13 / 2023',
  'ABNT NBR 13277',
  'OUTRO',
] as const;

export const HEAD_TYPES = [
  'Semielíptico',
  'Semiesférico',
  'Torisférico',
  'Cone',
  'Plano',
  'Não se aplica',
] as const;

// ============================================================
// CONFIGURAÇÕES DO MOTOR
// ============================================================

export const ENGINE_CONFIG = {
  // Precisão decimal para resultados
  DECIMAL_PRECISION: {
    THICKNESS_MM: 2,
    PRESSURE_BAR: 2,
    STRESS_MPA: 1,
    CORROSION_RATE_MM_YEAR: 3,
    LIFE_YEARS: 1,
    PERCENTAGE: 1,
  },
  
  // Validação
  VALIDATION: {
    MIN_THICKNESS_MM: 0.1,
    MAX_THICKNESS_MM: 500,
    MIN_PRESSURE_BAR: 0,
    MAX_PRESSURE_BAR: 1000,
    MIN_TEMP_C: -100,
    MAX_TEMP_C: 600,
    MIN_OPERATING_TIME_YEARS: 0,
    MAX_OPERATING_TIME_YEARS: 100,
  },
  
  // Logs
  LOGGING: {
    ENABLED: true,
    LEVEL: 'INFO', // DEBUG, INFO, WARN, ERROR
    INCLUDE_INPUTS: true,
    INCLUDE_RESULTS: true,
  },
} as const;