import type { InspectionStatus, TechnicalReportStatus } from "@prisma/client";

// ================================================================
// Estados visíveis ao Portal do Cliente, derivados dos enums REAIS
// do schema Prisma (InspectionStatus / TechnicalReportStatus).
//
// Regra: o cliente só vê o que foi aprovado/liberado pela EngeServ.
// Rascunhos (DRAFT), revisões em curso (UNDER_REVIEW) e rejeitados
// (REJECTED, REJEITADA) são estados internos. Estados ambíguos quanto à
// publicação (ARCHIVED, EM_ANDAMENTO, AGUARDANDO_APROVACAO) permanecem
// ocultos até decisão de negócio da EngeServ.
// ================================================================

/** Estados do laudo técnico que o cliente pode ver/listar/detalhar. */
export const PORTAL_VISIBLE_REPORT_STATUSES: TechnicalReportStatus[] = [
  "APPROVED",
  "PUBLISHED",
];

/** Estados da inspeção visíveis ao cliente (histórico detalhado). */
export const PORTAL_VISIBLE_INSPECTION_STATUSES: InspectionStatus[] = ["APROVADA"];

export function isReportVisibleToPortal(status: string): boolean {
  return (PORTAL_VISIBLE_REPORT_STATUSES as string[]).includes(status);
}

export function isInspectionVisibleToPortal(status: string): boolean {
  return (PORTAL_VISIBLE_INSPECTION_STATUSES as string[]).includes(status);
}
