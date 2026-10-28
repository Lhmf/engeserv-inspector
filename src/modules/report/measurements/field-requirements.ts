export const REQUIRED_FIELD_MEASUREMENT_POINTS = [
  ...Array.from({ length: 5 }, (_, index) => `PM-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 4 }, (_, index) => `PM-${String(index + 6).padStart(2, "0")}`),
] as const;

export function missingRequiredFieldMeasurementPoints(points: Iterable<string>): string[] {
  const normalized = new Set(Array.from(points, (point) => point.trim().toUpperCase()));
  return REQUIRED_FIELD_MEASUREMENT_POINTS.filter((point) => !normalized.has(point));
}
