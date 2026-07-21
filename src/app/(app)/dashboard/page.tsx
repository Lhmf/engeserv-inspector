import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    clientCount,
    equipmentCount,
    userCount,
    inspections,
    criticalEquipmentsRaw,
    upcomingInspections,
    recentActivitiesRaw,
  ] = await Promise.all([
    prisma.client.count({ where: { active: true } }),
    prisma.equipment.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.inspection.findMany({
      include: {
        equipment: { select: { tag: true, type: true, client: { select: { companyName: true } } } },
        inspector: { select: { name: true } },
        measurements: true,
      },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.equipment.findMany({
      where: {
        active: true,
        minThicknessMm: { not: null },
        originalThicknessMm: { not: null },
      },
      include: {
        client: { select: { companyName: true, id: true } },
        inspections: {
          where: { status: { in: ["APROVADA", "EM_ANDAMENTO", "AGUARDANDO_APROVACAO"] } },
          orderBy: { startedAt: "desc" },
          take: 1,
          include: { measurements: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
      take: 20,
    }),
    prisma.inspection.findMany({
      where: {
        status: { in: ["EM_ANDAMENTO", "AGUARDANDO_APROVACAO"] },
      },
      include: {
        equipment: { select: { tag: true, client: { select: { companyName: true } } } },
        inspector: { select: { name: true } },
      },
      orderBy: { startedAt: "asc" },
      take: 5,
    }),
    prisma.$queryRaw<Array<{ id: string; action: string; entity: string; entityName: string; userName: string; createdAt: Date }>>`
      SELECT 
        'inspection' as action,
        i.id,
        'inspection' as entity,
        i.id as "entityName",
        u.name as "userName",
        i."startedAt" as "createdAt"
      FROM "inspections" i
      JOIN "users" u ON i."inspectorId" = u.id
      WHERE i."startedAt" >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 
        'equipment' as action,
        e.id,
        'equipment' as entity,
        e.tag as "entityName",
        u.name as "userName",
        e."createdAt"
      FROM "equipments" e
      LEFT JOIN "users" u ON e."clientId" = u.id
      WHERE e."createdAt" >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 
        'client' as action,
        c.id,
        'client' as entity,
        c."companyName" as "entityName",
        u.name as "userName",
        c."createdAt"
      FROM "clients" c
      LEFT JOIN "users" u ON c."responsibleId" = u.id
      WHERE c."createdAt" >= NOW() - INTERVAL '7 days'
      ORDER BY "createdAt" DESC
      LIMIT 10
    `,
  ]);

  // Calculate inspection stats
  const totalInspections = inspections.length;
  const approvedInspections = inspections.filter((i) => i.status === "APROVADA").length;
  const pendingInspections = inspections.filter((i) => i.status === "AGUARDANDO_APROVACAO").length;
  const inProgressInspections = inspections.filter((i) => i.status === "EM_ANDAMENTO").length;
  const rejectedInspections = inspections.filter((i) => i.status === "REJEITADA").length;

  // Calculate critical equipment
  const criticalEquipments = criticalEquipmentsRaw
    .map((eq) => {
      const latestInspection = eq.inspections[0];
      const lastMeasurement = latestInspection?.measurements[0];
      const currentThickness = lastMeasurement?.thicknessMm ?? eq.originalThicknessMm ?? 0;
      const minThickness = eq.minThicknessMm ?? 0;
      const originalThickness = eq.originalThicknessMm ?? 0;
      const wearPercent = originalThickness > 0 ? ((originalThickness - currentThickness) / originalThickness) * 100 : 0;
      const marginPercent = minThickness > 0 ? ((currentThickness - minThickness) / minThickness) * 100 : 100;
      
      let status: "CRITICO" | "ATENCAO" | "OK" = "OK";
      if (currentThickness <= minThickness) status = "CRITICO";
      else if (marginPercent < 20) status = "ATENCAO";
      
      return { ...eq, currentThickness, wearPercent, marginPercent, status };
    })
    .filter((eq) => eq.status !== "OK")
    .sort((a, b) => {
      const order = { CRITICO: 0, ATENCAO: 1, OK: 2 };
      return order[a.status] - order[b.status];
    })
    .slice(0, 5);

  // Process activities
  const activities = recentActivitiesRaw.map((act) => ({
    ...act,
    time: getRelativeTime(act.createdAt),
    color: act.action === "inspection" ? "bg-blue-100 text-blue-600" : act.action === "equipment" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600",
  }));

  // Status data for pie chart
  const statusData = [
    { name: "Aprovadas", value: approvedInspections, color: "#10b981" },
    { name: "Em Andamento", value: inProgressInspections, color: "#3b82f6" },
    { name: "Aguardando Aprovação", value: pendingInspections, color: "#f59e0b" },
    { name: "Rejeitadas", value: rejectedInspections, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Monthly data
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const currentMonth = new Date().getMonth();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = (currentMonth - 5 + i + 12) % 12;
    const year = currentMonth - 5 + i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const count = inspections.filter((insp) => {
      const d = new Date(insp.startedAt);
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    }).length;
    return { name: months[monthIdx], inspections: count };
  });

  // Equipment by type
  const equipmentsByType = await prisma.equipment.groupBy({
    by: ["type"],
    where: { active: true },
    _count: true,
  });

  const typeLabels: Record<string, string> = {
    CALDEIRA: "Caldeiras",
    VASO_DE_PRESSAO: "Vasos de Pressão",
    TANQUE: "Tanques",
    SILO: "Silos",
    TUBULACAO: "Tubulações",
    COMPRESSOR: "Compressores",
    TROCADOR_DE_CALOR: "Trocadores",
    REATOR: "Reatores",
    OUTRO: "Outros",
  };

  const equipmentTypeData = equipmentsByType.map((e) => ({
    name: typeLabels[e.type] || e.type,
    value: e._count,
  }));

  // Pass all data to client component
  return (
    <DashboardClient
      clientCount={clientCount}
      equipmentCount={equipmentCount}
      userCount={userCount}
      totalInspections={totalInspections}
      approvedInspections={approvedInspections}
      pendingInspections={pendingInspections}
      inProgressInspections={inProgressInspections}
      rejectedInspections={rejectedInspections}
      inspections={inspections}
      criticalEquipments={criticalEquipments}
      upcomingInspections={upcomingInspections}
      activities={activities}
      statusData={statusData}
      monthlyData={monthlyData}
      equipmentTypeData={equipmentTypeData}
    />
  );
}

function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora mesmo";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return then.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}