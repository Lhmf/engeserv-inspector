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

  if (parsed && typeof parsed === "object" && "immediate" in parsed) {
    return normalizeRecommendations((parsed as { immediate?: unknown }).immediate);
  }

  return [];
}

export function serializeRecommendations(value: unknown): string {
  return JSON.stringify(normalizeRecommendations(value));
}
