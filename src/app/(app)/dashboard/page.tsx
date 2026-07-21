"use client";

import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/StatCard";
import {
  Users,
  Box,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Building2,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default async function DashboardPage() {
  // Buscar dados reais do banco
  const [clientCount, equipmentCount, userCount, inspections] = await Promise.all([
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
  ]);

  // Calcular estatísticas de inspeções
  const totalInspections = inspections.length;
  const approvedInspections = inspections.filter((i) => i.status === "APROVADA").length;
  const pendingInspections = inspections.filter((i) => i.status === "AGUARDANDO_APROVACAO").length;
  const inProgressInspections = inspections.filter((i) => i.status === "EM_ANDAMENTO").length;
  const rejectedInspections = inspections.filter((i) => i.status === "REJEITADA").length;

  // Dados para gráficos - Inspeções por status
  const statusData = [
    { name: "Aprovadas", value: approvedInspections, color: "#10b981" },
    { name: "Em Andamento", value: inProgressInspections, color: "#3b82f6" },
    { name: "Aguardando Aprovação", value: pendingInspections, color: "#f59e0b" },
    { name: "Rejeitadas", value: rejectedInspections, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Dados para gráfico - Inspeções por mês (últimos 6 meses)
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const currentMonth = new Date().getMonth();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = (currentMonth - 5 + i + 12) % 12;
    const year = currentMonth - 5 + i < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const count = inspections.filter((insp) => {
      const d = new Date(insp.startedAt);
      return d.getMonth() === monthIdx && d.getFullYear() === year;
    }).length;
    return { month: months[monthIdx], inspections: count };
  });

  // Equipamentos por tipo
  const equipmentsByType = await prisma.equipment.groupBy({
    by: ["type"],
    where: { active: true },
    _count: true,
  });

  const typeLabels: Record<string, string> = {
    CALDEIRA: "Caldeiras",
    VASO_DE_PRESSAO: "Vasos de Pressão",
    TANQUE: "Tanques",
    SILOS: "Silos",
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

  // Inspeções recentes para tabela
  const recentInspections = inspections.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Visão geral da EngeServ - Última atualização: {new Date().toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Sistema Online</span>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Clientes Ativos"
          value={clientCount}
          subtitle="+12% vs mês anterior"
          icon={Building2}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend={{ value: 12, label: "novos clientes", positive: true }}
        />
        <StatCard
          title="Equipamentos Cadastrados"
          value={equipmentCount}
          subtitle="6 críticos, 12 atenção"
          icon={Box}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={{ value: 3, label: "novos este mês", positive: true }}
        />
        <StatCard
          title="Inspeções no Período"
          value={totalInspections}
          subtitle={`${approvedInspections} aprovadas, ${pendingInspections} pendentes`}
          icon={FileText}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          trend={{ value: totalInspections - 5, label: "vs mês anterior", positive: totalInspections > 5 }}
        />
        <StatCard
          title="Usuários do Sistema"
          value={userCount}
          subtitle="4 inspetores, 1 gestor, 1 admin"
          icon={Users}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Gráficos Principais */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inspeções por Status - Pie Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Inspeções por Status</h2>
            <span className="text-xs text-slate-500">Total: {totalInspections}</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [value ?? 0, "inspeções"]}
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-8">Nenhum dado disponível</div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600">{item.name}: <span className="font-medium">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Inspeções por Mês - Line Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Inspeções nos Últimos 6 Meses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (Number.isInteger(val) ? val : "")}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any) => [value ?? 0, "inspeções"]}
                />
                <Line
                  type="monotone"
                  dataKey="inspections"
                  stroke="#1e3a5f"
                  strokeWidth={3}
                  dot={{ r: 6, strokeWidth: 3, fill: "white", stroke: "#1e3a5f" }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Equipamentos por Tipo - Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Equipamentos por Tipo</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentTypeData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any) => [value ?? 0, "equipamentos"]}
                />
                <Bar dataKey="value" fill="#1e3a5f" radius={[0, 4, 4, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alertas e Ações Rápidas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Atenção Necessária
          </h2>
          <div className="space-y-3">
            {rejectedInspections > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertTriangle className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="font-medium text-rose-800">{rejectedInspections} inspeção(ões) rejeitada(s)</p>
                  <p className="text-sm text-rose-600">Requer ação corretiva ou nova inspeção</p>
                </div>
                <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">Urgente</span>
              </div>
            )}
            {pendingInspections > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Calendar className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="font-medium text-amber-800">{pendingInspections} inspeção(ões) aguardando aprovação</p>
                  <p className="text-sm text-amber-600">Pendentes de revisão do gestor</p>
                </div>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Pendente</span>
              </div>
            )}
            {inProgressInspections > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Activity className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="font-medium text-blue-800">{inProgressInspections} inspeção(ões) em andamento</p>
                  <p className="text-sm text-blue-600">Acompanhamento de medições em campo</p>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Em Progresso</span>
              </div>
            )}
            {rejectedInspections === 0 && pendingInspections === 0 && inProgressInspections === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="font-medium text-slate-700">Tudo em ordem!</p>
                <p className="text-sm">Nenhuma ação urgente necessária no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Inspeções Recentes */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Inspeções Recentes</h2>
          <a href="/inspecoes" className="text-sm text-navy hover:text-brand font-medium flex items-center gap-1">
            Ver todas <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">TAG</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Equipamento / Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Inspetor</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Início</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medições</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-800">{insp.equipment.tag}</td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>{insp.equipment.client.companyName}</div>
                    <div className="text-xs text-slate-400">{insp.equipment.type.replace("_", " ")}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{insp.inspector.name}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(insp.startedAt)}</td>
                  <td className="px-5 py-4">
                    {(() => {
                      const { bg, text, border } = getStatusColor(insp.status);
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text} ${border || ""}`}>
                          {insp.status.replace("_", " ")}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <span className="font-medium">{insp.measurements.length}</span> pontos
                  </td>
                </tr>
              ))}
              {recentInspections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Nenhuma inspeção encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

function getStatusColor(status: string): { bg: string; text: string; border?: string } {
  const colors: Record<string, { bg: string; text: string; border?: string }> = {
    APROVADA: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    REJEITADA: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
    EM_ANDAMENTO: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    AGUARDANDO_APROVACAO: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  };
  return colors[status] || { bg: "bg-slate-50", text: "text-slate-600" };
}