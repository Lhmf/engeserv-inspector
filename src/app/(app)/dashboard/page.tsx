import { prisma } from "@/lib/prisma";
import { KpiCard } from "@/components/KpiCard";

export default async function DashboardPage() {
  const [clientCount, equipmentCount, userCount] = await Promise.all([
    prisma.client.count(),
    prisma.equipment.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Visao geral da EngeServ. Os indicadores de laudos e validades serao
          ativados a partir da Sprint 5/6 (ver docs/ROADMAP.md).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Clientes cadastrados" value={clientCount} />
        <KpiCard label="Equipamentos cadastrados" value={equipmentCount} />
        <KpiCard label="Usuarios do sistema" value={userCount} />
        <KpiCard label="Laudos ativos" value="—" />
        <KpiCard label="Vencem em 30 dias" value="—" />
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">Proximos na fundacao (Sprint 1):</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Calendario de validades (Sprint 6)</li>
          <li>Grafico de laudos por mes (Sprint 6)</li>
          <li>Lista de proximos vencimentos por cliente (Sprint 6)</li>
        </ul>
      </div>
    </div>
  );
}
