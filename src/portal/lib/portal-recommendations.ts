// ================================================================
// Formatação de recomendações (puro, sem Prisma/next) — usado por
// /api/portal/recomendacoes, /api/portal/laudos/[id] e
// /api/portal/equipamentos/[id].
//
// Formatos de origem (reais do schema):
// - Inspection.recommendations: String contendo texto livre OU array JSON
//   (ex.: [{"description":"..."}])
// - TechnicalReport.recommendations: Json estruturado
//   ({immediate, shortTerm, mediumTerm, longTerm}) ou string/array.
//
// Saída: texto plano ("label\n- item") ou null. As páginas do portal
// aplicam formatação equivalente no cliente; o texto servidor é
// pass-through (idempotente) para o frontend.
// ================================================================

function itemText(item: unknown): string | null {
  if (typeof item === "string") {
    const text = item.trim();
    return text || null;
  }
  if (item && typeof item === "object" && "description" in item) {
    const description = (item as { description?: unknown }).description;
    return typeof description === "string" && description.trim() ? description.trim() : null;
  }
  return null;
}

function sectionsText(section: Record<string, unknown>): string | null {
  const groups: Array<[string, unknown]> = [
    ["Ações imediatas", section.immediate],
    ["Curto prazo", section.shortTerm],
    ["Médio prazo", section.mediumTerm],
    ["Longo prazo", section.longTerm],
  ];
  const lines: string[] = [];
  for (const [label, items] of groups) {
    if (!Array.isArray(items)) continue;
    const texts = items.map(itemText).filter((t): t is string => !!t);
    if (texts.length) {
      lines.push(label);
      lines.push(...texts.map((t) => `- ${t}`));
    }
  }
  return lines.length ? lines.join("\n") : null;
}

export function formatarRecomendacoes(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "[]") return null;
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const lines = parsed.map(itemText).filter((t): t is string => !!t);
        return lines.length ? lines.join("\n") : null;
      }
      if (parsed && typeof parsed === "object") {
        const viaSections = sectionsText(parsed as Record<string, unknown>);
        if (viaSections) return viaSections;
        if ("description" in parsed) {
          const viaDescription = itemText(parsed);
          if (viaDescription) return viaDescription;
        }
      }
    } catch {
      // texto livre, não é JSON
    }
    return trimmed;
  }
  if (Array.isArray(value)) {
    const lines = value.map(itemText).filter((t): t is string => !!t);
    return lines.length ? lines.join("\n") : null;
  }
  if (typeof value === "object") {
    return sectionsText(value as Record<string, unknown>);
  }
  return null;
}
