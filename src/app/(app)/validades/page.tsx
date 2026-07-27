import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ValidadesClient } from "./ValidadesClient";

export const dynamic = "force-dynamic";

export default async function ValidadesPage() {
  const session = await getSession();
  if (!session) return null;

  // Buscar equipamentos com inspeções aprovadas
  const equipments = await prisma.equipment.findMany({
    where: { active: true },
    include: {
      client: { select: { id: true, companyName: true } },
      inspections: {
        where: { status: "APROVADA" },
        orderBy: { approvedAt: "desc" },
        take: 1,
        select: { approvedAt: true },
      },
    },
    orderBy: { tag: "asc" },
  });

  // Buscar clientes para o filtro
  const clients = await prisma.client.findMany({
    where: { active: true },
    select: { id: true, companyName: true },
    orderBy: { companyName: "asc" },
  });

  const validadesData = equipments.map((eq) => ({
    equipmentId: eq.id,
    equipmentTag: eq.tag,
    equipmentType: eq.type,
    clientId: eq.clientId,
    clientName: eq.client.companyName,
    lastApprovedAt: eq.inspections[0]?.approvedAt ?? null,
    periodicityMonths: eq.periodicityMonths,
  }));

  return (
    <ValidadesClient
      validades={validadesData}
      clients={clients}
    />
  );
}
