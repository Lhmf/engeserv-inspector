/**
 * Report Module — Emission Safety Barrier (Lote 23A)
 *
 * Barreira de segurança que impede a emissão/publicação de um laudo
 * técnico DEFINITIVO quando os resultados dependem de fórmulas do
 * Engineering Engine marcadas como placeholder (reliability
 * THEORETICAL / versão "1.0.0-placeholder" / status diferente de
 * SUCCESS).
 *
 * Regras de ouro (não negociáveis):
 * - Nenhum laudo definitivo pode ser gerado com fórmula placeholder,
 *   por nenhum caminho (PDF, aprovação, publicação).
 * - Nenhuma alegação de conformidade normativa (NR-13/ASME/API) pode
 *   ser apresentada enquanto os cálculos não estiverem validados.
 * - Valores ausentes NUNCA são substituídos por números inventados.
 * - Fórmulas não validadas NUNCA são declaradas como validadas.
 * - Documentos de demonstração devem ser marcados de forma
 *   explícita e persistente.
 */

// ============================================================
// TIPOS
// ============================================================

export type EmissionMode = 'DEFINITIVE' | 'DEMO';

export interface EmissionAssessment {
  /** IDs das fórmulas com versão marcada como placeholder */
  placeholderFormulas: string[];
  /** Cálculos com resultados que NÃO podem ser apresentados como válidos */
  unvalidatedCalculations: Array<{ id: string; reason: string }>;
  /** Há algum resultado de engenharia registrado no laudo? */
  hasEngineeringResults: boolean;
  /** A emissão de laudo técnico DEFINITIVO está permitida? */
  canEmitDefinitive: boolean;
  /** O critério de adoção dos pontos não medidos foi aprovado pelo RT? */
  regionalAdoptionApproved: boolean;
  technicalValidationApproved: boolean;
  technicalValidationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  /** Motivos legíveis do bloqueio (para API e UI) */
  reasons: string[];
}

const PLACEHOLDER_PATTERN = /placeholder/i;

// ============================================================
// AVISOS PADRONIZADOS (texto exibido nos documentos de demonstração)
// ============================================================

export const DEMO_BANNER_TEXT =
  'DEMONSTRAÇÃO - NÃO VÁLIDO PARA USO TÉCNICO';
export const DEMO_NO_CLAIM_TEXT =
  'DOCUMENTO SEM ALEGAÇÃO DE CONFORMIDADE NORMATIVA';
export const PLACEHOLDER_WARNING_TEXT =
  'CÁLCULOS DE FÓRMULAS NÃO VALIDADAS - VALORES MERAMENTE ESTIMATIVOS';
export const UNVALIDATED_FORMULA_DISCLAIMER =
  'AVISO: fórmulas de cálculo NÃO validadas. Este laudo NÃO atesta conformidade ' +
  'com NR-13/ASME/API e NÃO pode ser usado como documento técnico definitivo.';

/** Valor exibido quando um cálculo existe mas não é válido */
export const NOT_VALIDATED_TEXT = 'N/D (não validado)';
/** Valor exibido quando um cálculo não existe no laudo */
export const MISSING_TEXT = '-';

// ============================================================
// HELPERS INTERNOS
// ============================================================

function isPlaceholderVersion(version: unknown): boolean {
  return typeof version === 'string' && PLACEHOLDER_PATTERN.test(version);
}

interface RawCalculation {
  value?: unknown;
  status?: string;
  reliability?: string;
  explanation?: string;
  observations?: string[];
  metadata?: {
    formulaVersion?: string;
    [key: string]: unknown;
  };
}

function readRawCalculation(input: unknown): RawCalculation | null {
  if (!input || typeof input !== 'object') return null;
  return input as RawCalculation;
}

function calcIsUnvalidated(
  calc: RawCalculation,
  formulaId: string
): { unvalidated: boolean; reason: string } {
  const status = calc.status;
  const reliability = calc.reliability;
  const version = calc.metadata?.formulaVersion;

  const issues: string[] = [];
  if (status !== 'SUCCESS') {
    issues.push(`status=${status ?? 'indefinido'}`);
  }
  if (reliability === 'THEORETICAL') {
    issues.push('reliability=THEORETICAL (apenas teórico, sem dados de campo validados)');
  }
  if (isPlaceholderVersion(version)) {
    issues.push(`formulaVersion=${version} (placeholder)`);
  }

  const unvalidated = issues.length > 0 && status !== 'NOT_APPLICABLE';
  return {
    unvalidated,
    reason: unvalidated
      ? `${formulaId}: ${issues.join('; ')}`
      : '',
  };
}

function collectCalculations(report: any): Map<string, RawCalculation> {
  const calcs = new Map<string, RawCalculation>();
  const analysis = report?.engineeringResults?.integrityAnalysis;
  for (const id of [
    'minimumThickness',
    'corrosionRate',
    'remainingLife',
    'mawp',
    'nextInspectionDate',
  ]) {
    const raw = readRawCalculation(analysis?.[id]);
    if (raw) calcs.set(id, raw);
  }

  for (const calculation of analysis?.calculations || []) {
    const label = String(calculation?.label || '').toLowerCase();
    const calculationId = String(calculation?.id || '').toLowerCase();
    const id = label.includes('corros') || calculationId.startsWith('cr-')
      ? 'corrosionRate'
      : label.includes('pmta') || calculationId.startsWith('mawp-')
        ? 'mawp'
        : label.includes('espessura m') || calculationId.startsWith('tmin-')
          ? 'minimumThickness'
          : label.includes('vida') || calculationId.startsWith('rl-')
            ? 'remainingLife'
            : null;
    if (id && !calcs.has(id)) calcs.set(id, calculation);
  }
  return calcs;
}

// ============================================================
// AVALIAÇÃO DE EMISSÃO
// ============================================================

/**
 * Avalia se um laudo (objeto TechnicalReport ou o registro bruto do
 * Prisma já parseado) pode ser emitido como documento técnico
 * DEFINITIVO. Pura — não depende de banco nem de Next.
 */
export function assessTechnicalReportEmission(report: any): EmissionAssessment {
  const placeholderFormulas: string[] = [];
  const unvalidatedCalculations: Array<{ id: string; reason: string }> = [];
  const reasons: string[] = [];
  const regionalAdoptionApproved = report?.metadata?.regionalAdoptionApproved === true || report?.inspectionData?.regionalAdoptionApproved === true;
  const technicalValidation = report?.metadata?.technicalValidation;
  const technicalValidationStatus = technicalValidation?.status === 'APPROVED'
    ? 'APPROVED'
    : technicalValidation?.status === 'REJECTED'
      ? 'REJECTED'
      : 'PENDING';
  const technicalValidationApproved = technicalValidationStatus === 'APPROVED' &&
    typeof technicalValidation?.approvedById === 'string' &&
    typeof technicalValidation?.approvedAt === 'string';

  const results = report?.engineeringResults;
  const integrityAnalysis = results?.integrityAnalysis;

  // --- 1. Versões de fórmulas marcadas como placeholder -------------
  const formulaVersions: Record<string, unknown> = {
    ...(integrityAnalysis?.formulaVersions || {}),
    ...(results?.formulaVersions || {}),
  };
  for (const [id, version] of Object.entries(formulaVersions)) {
    if (isPlaceholderVersion(version)) {
      placeholderFormulas.push(id);
    }
  }
  // metadata.placeholderMode persistido por versões antigas do pipeline
  if (report?.metadata?.placeholderMode === true && placeholderFormulas.length === 0) {
    placeholderFormulas.push('(metadata.placeholderMode=true)');
  }

  // --- 2. Cálculos não validados ------------------------------------
  const calcs = collectCalculations(report);
  for (const [id, calc] of calcs) {
    const { unvalidated, reason } = calcIsUnvalidated(calc, id);
    if (unvalidated) {
      unvalidatedCalculations.push({ id, reason });
      // Um cálculo não validado cuja fórmula não é "placeholder" ainda
      // assim não pode sustentar uma conclusão definitiva.
      if (!placeholderFormulas.includes(id)) {
        placeholderFormulas.push(id);
      }
    }
  }

  const hasEngineeringResults =
    Object.keys(formulaVersions).length > 0 || calcs.size > 0;

  // --- 3. Motivos de bloqueio ----------------------------------------
  if (!hasEngineeringResults) {
    reasons.push(
      'Laudo sem resultados de engenharia registrados — não é possível emitir conclusão técnica definitiva.'
    );
  }
  if (!regionalAdoptionApproved) {
    reasons.push('Critério de adoção dos pontos não medidos ainda não foi aprovado pelo responsável técnico.');
  }
  if (!technicalValidationApproved) {
    reasons.push('Validação técnica pendente: um administrador responsável precisa revisar e aprovar os resultados e o critério de pontos não medidos.');
  }
  if (placeholderFormulas.length > 0 && !technicalValidationApproved) {
    reasons.push(
      `Fórmulas/cálculos não validados (fórmulas placeholder ou reliability THEORETICAL): ${[
        ...new Set(placeholderFormulas),
      ]
        .map((id) => (id.startsWith('(') ? id : `${id} (${formulaVersions[id] ?? 'sem versão validada'})`))
        .join(', ')}.`
    );
  }

  // A aprovação explícita do responsável técnico valida o conjunto de
  // resultados persistido para este laudo. Ela não altera fórmulas, valores
  // ou medições; apenas registra a decisão auditável que libera a emissão.
  const canEmitDefinitive = hasEngineeringResults && regionalAdoptionApproved && technicalValidationApproved;

  return {
    placeholderFormulas,
    unvalidatedCalculations,
    hasEngineeringResults,
    regionalAdoptionApproved,
    technicalValidationApproved,
    technicalValidationStatus,
    canEmitDefinitive,
    reasons,
  };
}

// ============================================================
// SANITIZAÇÃO DO LAUDO PARA EMISSÃO
// ============================================================

const NORMATIVE_CLAIM_PATTERN = /conforme?\s+(NR-?13|ASME|API)/i;

/**
 * Prepara o laudo para emissão/impressão. Quando a emissão definitiva
 * NÃO é permitida (placeholder), remove alegações de conformidade
 * normativa e marca as conclusões como estimativas não validadas.
 * NÃO altera números de medições nem fórmulas — apenas alegações.
 */
export function sanitizeForEmission(
  report: any,
  mode: EmissionMode,
  assessment: EmissionAssessment
): any {
  const blocked = !assessment.canEmitDefinitive;
  const sanitized = { ...report };

  // --- Conclusão técnica sem alegação normativa --------------------
  if (blocked) {
    const conclusion = { ...(report.technicalConclusion || {}) };
    const statement = String(conclusion.complianceStatement || '');
    if (!statement || NORMATIVE_CLAIM_PATTERN.test(statement)) {
      conclusion.complianceStatement = UNVALIDATED_FORMULA_DISCLAIMER;
    } else if (!/não\s+validad/i.test(statement)) {
      // Mantém textos adicionais apenas se não alegarem validação.
      conclusion.complianceStatement = `${statement} ${UNVALIDATED_FORMULA_DISCLAIMER}`;
    }

    // Justificativa padrão citava cálculos normativos como se validados.
    const justification = String(conclusion.justification || '');
    if (NORMATIVE_CLAIM_PATTERN.test(justification)) {
      conclusion.justification =
        'Análise baseada em medições ultrassônicas registradas e em cálculos de fórmulas NÃO validadas (placeholder). ' +
        justification.replace(NORMATIVE_CLAIM_PATTERN, 'formula não validada');
    }

    // Critérios de aceitação não devem alegar conformidade.
    const stripClaim = (criteria: unknown) =>
      typeof criteria === 'string' && NORMATIVE_CLAIM_PATTERN.test(criteria)
        ? 'Critérios a definir após validação dos cálculos por engenheiro responsável'
        : criteria;

    const recommendations = { ...(report.recommendations || {}) };
    if (recommendations.inspection) {
      recommendations.inspection = {
        ...recommendations.inspection,
        criteria: stripClaim(recommendations.inspection.criteria),
      };
    }
    sanitized.recommendations = recommendations;

    sanitized.nextInspection = {
      ...(report.nextInspection || {}),
      acceptanceCriteria: stripClaim(
        (report.nextInspection || {}).acceptanceCriteria
      ),
    };

    sanitized.technicalConclusion = conclusion;
  }

  // --- Documento de demonstração: identificação explícita ----------
  if (mode === 'DEMO') {
    const summary = { ...(report.executiveSummary || {}) };
    if (typeof summary.overview === 'string' && !summary.overview.startsWith('[DEMONSTRAÇÃO]')) {
      summary.overview = `[DEMONSTRAÇÃO - NÃO VÁLIDO PARA USO TÉCNICO] ${summary.overview}`;
    }
    sanitized.executiveSummary = summary;
  }

  return sanitized;
}

// ============================================================
// EXTRAÇÃO DE INDICADORES (T13b)
// ============================================================

export interface EmissionIndicator {
  value: unknown;
  /** true somente quando o resultado é válido e aprovado */
  valid: boolean;
  /** Texto a exibir no PDF (nunca um número inventado) */
  text: string;
  unit?: string;
  reason?: string;
}

function formatIndicator(
  calc: RawCalculation | null,
  formatter: (value: any) => string,
  unit: string
): EmissionIndicator {
  if (!calc) {
    return { value: null, valid: false, text: MISSING_TEXT, unit, reason: 'cálculo ausente no laudo' };
  }
  const { unvalidated, reason } = calcIsUnvalidated(calc, 'calc');
  if (calc.value === null || calc.value === undefined || unvalidated) {
    // Não inventa número: exibe N/D com motivo.
    return {
      value: calc.value ?? null,
      valid: false,
      text: NOT_VALIDATED_TEXT,
      unit,
      reason: reason || 'resultado não é válido e aprovado',
    };
  }
  return { value: calc.value, valid: true, text: formatter(calc.value), unit };
}

/**
 * Mapeia os cálculos do engine para os indicadores do PDF.
 * Valores só aparecem quando válidos e aprovados; caso contrário,
 * exibe N/D (não validado) ou '-' — nunca um número inventado.
 */
export function extractEmissionIndicators(report: any): {
  minimumThicknessRegistered: EmissionIndicator;
  minimumThicknessCalculated: EmissionIndicator;
  corrosionRate: EmissionIndicator;
  remainingLife: EmissionIndicator;
  mawp: EmissionIndicator;
  /**
   * Nota de divergência entre espessura mínima cadastrada e calculada,
   * quando apurável. null quando nada há a notar.
   */
  minThicknessDivergenceNote: string | null;
} {
  const analysis = report?.engineeringResults?.integrityAnalysis;
  const calcs = collectCalculations(report);
  const registered = report?.equipment?.minThicknessMm;

  const minimumThicknessRegistered: EmissionIndicator = registered
    ? { value: registered, valid: true, text: `${registered} mm` }
    : { value: null, valid: false, text: MISSING_TEXT, reason: 'espessura mínima não cadastrada' };

  const minimumThicknessCalculated = formatIndicator(
    calcs.get('minimumThickness') ?? readRawCalculation(analysis?.minimumThickness),
    (v) => `${Number(v).toFixed(2)} mm`,
    'mm'
  );

  let minThicknessDivergenceNote: string | null = null;
  if (minimumThicknessCalculated.valid && registered) {
    const diff = Math.abs(Number(minimumThicknessCalculated.value) - Number(registered));
    if (diff > 0.05) {
      minThicknessDivergenceNote =
        `Divergência: espessura mínima calculada (${minimumThicknessCalculated.text}) ` +
        `diverge da cadastrada (${registered} mm) - resultado não validado por engenheiro`;
    }
  } else if (!minimumThicknessCalculated.valid && calcs.has('minimumThickness')) {
    minThicknessDivergenceNote =
      'Espessura mínima CALCULADA (estimativa não validada) não disponível (cálculo não validado). ' +
      'Exibida apenas a espessura mínima cadastrada.';
  }

  return {
    minimumThicknessRegistered,
    minimumThicknessCalculated,
    corrosionRate: formatIndicator(
      calcs.get('corrosionRate') ?? readRawCalculation(analysis?.corrosionRate),
      (v) => `${Number(v).toFixed(3)} mm/ano`,
      'mm/ano'
    ),
    remainingLife: formatIndicator(
      calcs.get('remainingLife') ?? readRawCalculation(analysis?.remainingLife),
      (v) => `${Number(v).toFixed(1)} anos`,
      'anos'
    ),
    mawp: formatIndicator(
      calcs.get('mawp') ?? readRawCalculation(analysis?.mawp),
      (v) => `${Number(v).toFixed(2)} bar`,
      'bar'
    ),
    minThicknessDivergenceNote,
  };
}

// ============================================================
// ERRO DE BARREIRA
// ============================================================

export class EmissionBarrierError extends Error {
  readonly assessment: EmissionAssessment;
  readonly missingCompany?: boolean;

  constructor(assessment: EmissionAssessment, missingCompany: boolean, reasons: string[]) {
    super(
      'EMISSÃO DE LAUDO TÉCNICO DEFINITIVO BLOQUEADA. Motivos: ' +
        reasons.join(' | ')
    );
    this.name = 'EmissionBarrierError';
    this.assessment = assessment;
    this.missingCompany = missingCompany;
  }
}
