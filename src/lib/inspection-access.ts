import type { Role } from "@/lib/auth";

/**
 * Regras compartilhadas de escrita em medições de inspeção.
 *
 * O inspetor responsável pode lançar medições da própria inspeção.
 * Gestor e Admin Master podem atuar em qualquer inspeção.
 * Uma sessão válida, por si só, nunca autoriza a alteração.
 */
export function canManageInspectionMeasurements(
  session: { userId: string; role: Role },
  inspection: { inspectorId: string }
) {
  return (
    inspection.inspectorId === session.userId ||
    session.role === "GESTOR" ||
    session.role === "ADMIN_MASTER"
  );
}

/**
 * Inspeções encerradas (aprovadas ou rejeitadas) não aceitam novas
 * medições nem sobrescrita do conjunto existente.
 */
export function isInspectionLockedForMeasurements(status: string) {
  return status === "APROVADA" || status === "REJEITADA";
}
