"use client";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

// Mapeamento central de status -> { rótulo em pt-BR, classes } alinhado
// ao design system do portal. Cobre: status de validade (OK, PROXIMO,
// VENCIDO, SEM_DATA), status de inspeção do schema Prisma
// (AGENDADA, EM_ANDAMENTO, CONCLUIDA, AGUARDANDO_APROVACAO, APROVADA,
// REJEITADA), status de laudo técnico (DRAFT, UNDER_REVIEW, APPROVED,
// REJECTED, PUBLISHED, ARCHIVED) e status de inspeção operacionais
// (REPROVADA, CANCELADA). Statuses desconhecidos caem no rótulo
// original com cor neutra.
const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  // Validade de inspeção
  OK: { label: "Em dia", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  PROXIMO: { label: "Próximo do vencimento", classes: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  VENCIDO: { label: "Vencido", classes: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" },
  SEM_DATA: { label: "Sem data", classes: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  // Inspeção (schema.prisma enum InspectionStatus)
  AGENDADA: { label: "Agendada", classes: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  EM_ANDAMENTO: { label: "Em andamento", classes: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  CONCLUIDA: { label: "Concluída", classes: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", classes: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  APROVADA: { label: "Aprovada", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  REJEITADA: { label: "Rejeitada", classes: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" },
  REPROVADA: { label: "Reprovada", classes: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" },
  CANCELADA: { label: "Cancelada", classes: "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  // Laudo (schema.prisma enum TechnicalReportStatus) — útil caso a página
  // passe o status bruto; hoje a página usa vigente/OK.
  DRAFT: { label: "Rascunho", classes: "bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  UNDER_REVIEW: { label: "Em revisão", classes: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  APPROVED: { label: "Aprovado", classes: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  REJECTED: { label: "Rejeitado", classes: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400" },
  PUBLISHED: { label: "Publicado", classes: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  ARCHIVED: { label: "Arquivado", classes: "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const entry = STATUS_MAP[status];
  const classes = [
    "px-2 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
    entry ? entry.classes : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    className,
  ].filter(Boolean).join(" ");

  return <span className={classes}>{entry ? entry.label : status}</span>;
}
