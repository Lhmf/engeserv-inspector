import type { MeasurementPoint } from '@/modules/engineering/types';

export const REGIONAL_ADOPTION_NOTE = '* Valor adotado (menor valor medido da região), não medido.';

export const OFFICIAL_MEASUREMENT_LABELS = [
  ...Array.from({ length: 10 }, (_, index) => `PM-${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 8 }, (_, index) => `PM-${String(index + 11).padStart(2, '0')}`),
];

export interface OfficialMeasurementPoint {
  label: string;
  value: number | null;
  measured: boolean;
  note?: string;
}

function numericMeasurements(measurements: MeasurementPoint[]) {
  return measurements.filter((measurement) => Number.isFinite(Number(measurement.thicknessMm)));
}

function normalisePointLabel(point: unknown) {
  const label = String(point ?? '').trim().toUpperCase();
  const match = label.match(/^P[- ]?(\d{1,2})$/);
  return match ? `PM-${String(Number(match[1])).padStart(2, '0')}` : label;
}

export function buildOfficialMeasurementPoints(measurements: MeasurementPoint[]): OfficialMeasurementPoint[] {
  const actual = numericMeasurements(measurements);
  const byPoint = new Map(actual.map((measurement) => [normalisePointLabel(measurement.point), measurement]));
  const body = actual.filter((measurement) => {
    const number = Number(normalisePointLabel(measurement.point).match(/PM-(\d+)/i)?.[1]);
    return Number.isFinite(number) && number >= 1 && number <= 10;
  });
  const heads = actual.filter((measurement) => {
    const number = Number(normalisePointLabel(measurement.point).match(/PM-(\d+)/i)?.[1]);
    return Number.isFinite(number) && number >= 11 && number <= 18;
  });
  const bodyMinimum = body.length ? Math.min(...body.map((item) => Number(item.thicknessMm))) : null;
  const headsMinimum = heads.length ? Math.min(...heads.map((item) => Number(item.thicknessMm))) : null;

  return [
    ...Array.from({ length: 10 }, (_, index) => {
      const label = `PM-${String(index + 1).padStart(2, '0')}`;
      const measured = byPoint.get(label);
      const adopted = !measured;
      return { label: `PM-${String(index + 1).padStart(2, '0')}`, value: measured ? Number(measured.thicknessMm) : bodyMinimum, measured: !adopted && Boolean(measured), note: adopted && bodyMinimum !== null ? REGIONAL_ADOPTION_NOTE : undefined };
    }),
    ...Array.from({ length: 8 }, (_, index) => {
      const label = `PM-${String(index + 11).padStart(2, '0')}`;
      const measured = byPoint.get(label);
      const adopted = !measured;
      return { label: `PM-${String(index + 11).padStart(2, '0')}`, value: measured ? Number(measured.thicknessMm) : headsMinimum, measured: !adopted && Boolean(measured), note: adopted && headsMinimum !== null ? REGIONAL_ADOPTION_NOTE : undefined };
    }),
  ];
}

export function materializeRegionalMeasurements(measurements: MeasurementPoint[]): MeasurementPoint[] {
  return buildOfficialMeasurementPoints(measurements)
    .filter((point) => point.value !== null && !point.measured)
    .map((point) => ({ id: `adopted-${point.label}`, inspectionId: measurements[0]?.inspectionId || '', point: point.label, thicknessMm: point.value as number, notes: REGIONAL_ADOPTION_NOTE, createdAt: new Date(), updatedAt: new Date(), isAdopted: true } as MeasurementPoint));
}
