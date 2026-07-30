/**
 * Validades — cálculo de próxima inspeção e status de validade.
 *
 * Regras:
 * - Próxima data = última inspeção APROVADA (approvedAt) + periodicityMonths do equipamento
 * - Sem uma das duas informações → "sem data definida"
 * - Status: VENCIDO / PRÓXIMO / OK com janela configurável
 * - NÃO deriva periodicidade da categoria NR-13 (guarda a decisão manual do engenheiro)
 */

export type ValidadeStatus = "VENCIDO" | "PROXIMO" | "OK" | "SEM_DATA";

export interface ValidadeInfo {
  equipmentId: string;
  equipmentTag: string;
  equipmentType: string;
  clientId?: string;
  clientName: string;
  lastApprovedAt: Date | null;
  periodicityMonths: number | null;
  nextDueDate: Date | null;
  status: ValidadeStatus;
}

/**
 * Calcula a próxima data de vencimento.
 */
export function calcularProximaData(
  lastApprovedAt: Date | null,
  periodicityMonths: number | null
): Date | null {
  if (!lastApprovedAt || !periodicityMonths) return null;
  const next = new Date(lastApprovedAt);
  next.setMonth(next.getMonth() + periodicityMonths);
  return next;
}

/**
 * Define a janela de "próximo vencimento" em dias (default 60).
 */
const DEFAULT_PROXIMO_WINDOW_DAYS = 60;

/**
 * Retorna o status de validade com base na data de vencimento.
 */
export function getValidadeStatus(
  nextDueDate: Date | null,
  proximoWindowDays: number = DEFAULT_PROXIMO_WINDOW_DAYS
): ValidadeStatus {
  if (!nextDueDate) return "SEM_DATA";

  const now = new Date();
  const diffMs = nextDueDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "VENCIDO";
  if (diffDays <= proximoWindowDays) return "PROXIMO";
  return "OK";
}

/**
 * Monta o objeto ValidadeInfo completo.
 */
export function buildValidadeInfo(params: {
  equipmentId: string;
  equipmentTag: string;
  equipmentType: string;
  clientId?: string;
  clientName: string;
  lastApprovedAt: Date | null;
  periodicityMonths: number | null;
}): ValidadeInfo {
  const nextDueDate = calcularProximaData(params.lastApprovedAt, params.periodicityMonths);
  return {
    ...params,
    clientId: params.clientId,
    lastApprovedAt: params.lastApprovedAt,
    periodicityMonths: params.periodicityMonths,
    nextDueDate,
    status: getValidadeStatus(nextDueDate),
  };
}

/**
 * Ordena lista de validades por vencimento mais próximo.
 */
export function ordenarPorVencimento(validades: ValidadeInfo[]): ValidadeInfo[] {
  return [...validades].sort((a, b) => {
    // SEM_DATA vai pro final
    if (!a.nextDueDate && !b.nextDueDate) return 0;
    if (!a.nextDueDate) return 1;
    if (!b.nextDueDate) return -1;
    return a.nextDueDate.getTime() - b.nextDueDate.getTime();
  });
}
