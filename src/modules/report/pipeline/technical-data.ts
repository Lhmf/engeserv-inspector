export type MissingTechnicalField = { key: string; label: string; unit: string };

export const TECHNICAL_FIELD_LABELS: Record<string, MissingTechnicalField> = {
  originalThicknessMm: { key: "originalThicknessMm", label: "Espessura original do equipamento", unit: "mm" },
  minThicknessMm: { key: "minThicknessMm", label: "Espessura mínima requerida", unit: "mm" },
  designPressureBar: { key: "designPressureBar", label: "Pressão de projeto", unit: "bar" },
};

export function getMissingTechnicalFields(equipment: Record<string, unknown> | null | undefined) {
  return Object.keys(TECHNICAL_FIELD_LABELS)
    .filter((key) => {
      const value = equipment?.[key];
      return value === null || value === undefined || value === "" || Number(value) <= 0;
    })
    .map((key) => TECHNICAL_FIELD_LABELS[key]);
}

export function isTechnicalDataError(message: string) {
  return /Campos obrigatórios ausentes|Validação falhou.*(originalThicknessMm|minThicknessMm|designPressureBar)/i.test(message);
}
