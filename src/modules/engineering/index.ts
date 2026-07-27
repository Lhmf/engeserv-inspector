/**
 * Engineering Engine - Exportação Principal
 * 
 * Ponto de entrada único para o módulo de engenharia.
 * Importar apenas daqui para manter encapsulamento.
 */

// Tipos
export * from './types';

// Constantes
export * from './constants';

// Utilitários
export * from './utils/units';

// Validadores
export * from './validators';

// Cálculos
export * from './calculations';

// Domínio
export * from './domain';

// Serviços
export { EngineeringEngineService, engineeringEngine } from './services/engine';

// Aplicação (Use Cases)
export * from './application/use-cases';

// Documentação
// export * from './docs/ENGINEERING_ENGINE.md'; // Não é módulo TS

// ============================================================
// HELPER PARA MONTAR CalculationInput DO BANCO
// ============================================================

import type { CalculationInput, EquipmentData, InspectionData, MeasurementPoint } from './types';

/**
 * Constrói CalculationInput a partir de dados do Prisma
 * Uso: const input = buildCalculationInput(equipment, inspection, measurements);
 */
export function buildCalculationInput(
  equipment: EquipmentData,
  inspection: InspectionData,
  measurements: MeasurementPoint[],
  options?: {
    previousInspectionDate?: Date;
    previousMinThicknessMm?: number;
    material?: CalculationInput['material'];
    operatingConditions?: CalculationInput['operatingConditions'];
  }
): CalculationInput {
  return {
    equipment,
    inspection,
    measurements,
    previousInspectionDate: options?.previousInspectionDate,
    previousMinThicknessMm: options?.previousMinThicknessMm,
    material: options?.material,
    operatingConditions: options?.operatingConditions,
    // Parâmetros calculados automaticamente se não fornecidos
    jointEfficiency: equipment.jointEfficiency,
    corrosionAllowanceMm: equipment.corrosionAllowanceMm,
    safetyFactor: 1.5,
  };
}

/**
 * Versão simplificada para uso em Server Components
 */
export async function buildCalculationInputFromIds(
  equipmentId: string,
  inspectionId: string,
  prisma: any // PrismaClient
): Promise<CalculationInput> {
  const [equipment, inspection, measurements] = await Promise.all([
    prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { client: true },
    }),
    prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { 
        equipment: { include: { client: true } },
        inspector: true,
        approvedBy: true,
      },
    }),
    prisma.inspectionMeasurement.findMany({
      where: { inspectionId },
      orderBy: { point: 'asc' },
    }),
  ]);

  if (!equipment) throw new Error(`Equipamento ${equipmentId} não encontrado`);
  if (!inspection) throw new Error(`Inspeção ${inspectionId} não encontrada`);

  // Buscar inspeção anterior do mesmo equipamento para taxa de corrosão
  const previousInspection = await prisma.inspection.findFirst({
    where: {
      equipmentId,
      id: { not: inspectionId },
      status: { in: ['APROVADA', 'REJEITADA'] },
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    include: {
      measurements: { orderBy: { thicknessMm: 'asc' }, take: 1 },
    },
  });

  let previousMinThicknessMm: number | undefined;
  let previousInspectionDate: Date | undefined;

  if (previousInspection?.measurements?.[0]) {
    previousMinThicknessMm = previousInspection.measurements[0].thicknessMm;
    previousInspectionDate = previousInspection.completedAt!;
  }

  return buildCalculationInput(equipment as any, inspection as any, measurements as any, {
    previousInspectionDate,
    previousMinThicknessMm,
  });
}