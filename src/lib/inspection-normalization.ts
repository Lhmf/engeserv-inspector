export function normalizeRecommendations(value: unknown): string[] {
  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = (parsed as string).split("\n");
    }
  }

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "description" in item) {
          return String((item as { description?: unknown }).description ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }

  if (parsed && typeof parsed === "object") {
    const structured = parsed as Record<string, unknown>;
    const sections = ["immediate", "shortTerm", "mediumTerm", "longTerm", "inspection"]
      .flatMap((key) => key in structured ? normalizeRecommendations(structured[key]) : []);
    if (sections.length > 0) return sections;
    if ("text" in structured || "title" in structured || "message" in structured) {
      return [String(structured.text ?? structured.title ?? structured.message)].filter(Boolean);
    }
  }

  return [];
}

export function serializeRecommendations(value: unknown): string {
  return JSON.stringify(normalizeRecommendations(value));
}
