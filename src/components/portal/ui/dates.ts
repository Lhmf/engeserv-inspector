/**
 * Formata uma data (ISO 8601 com ou sem horário, string ou Date|null) para DD/MM/YYYY.
 * Aceita "2026-10-01" e "2026-10-01T14:30:00.000Z".
 * Não introduz deslocamento de dia por timezone quando a origem representa apenas uma data.
 */
export function formatDataBR(value: string | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const iso = value instanceof Date ? value.toISOString() : value;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const date = dateOnly ? new Date(iso + "T00:00:00") : new Date(iso);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
