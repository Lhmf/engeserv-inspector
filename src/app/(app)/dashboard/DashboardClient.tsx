"use client";

import { StatCard } from "@/components/StatCard";
import { BarChartComponent } from "@/components/Charts/BarChart";
import { LineChartComponent } from "@/components/Charts/LineChart";
import { PieChartComponent } from "@/components/Charts/PieChart";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonKpiCard, SkeletonCard } from "@/components/ui/Skeleton";
import {
  Users,
  Box,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Building2,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  Building,
  Wrench,
  AlertCircle,
  TrendingDown,
  Upload,
  Download,
  ClipboardCheck,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getStatusColor, getEquipmentTypeIcon, getEquipmentTypeLabel, getRelativeTime } from "@/lib/utils";

interface DashboardClientProps {
  clientCount: number;
  equipmentCount: number;
  userCount: number;
  totalInspections: number;
  approvedInspections: number;
  pendingInspections: number;
  inProgressInspections: number;
  rejectedInspections: number;
  inspections: Array<{
    id: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    equipment: {
      tag: string;
      type: string;
      client: { companyName: string };
    };
    inspector: { name: string };
    measurements: { thicknessMm: number }[];
  }>;
  criticalEquipments: Array<{
    id: string;
    tag: string;
    type: string;
    currentThickness: number;
    minThicknessMm: number | null;
    originalThicknessMm: number | null;
    wearPercent: number;
    marginPercent: number;
    status: "CRITICO" | "ATENCAO" | "OK";
    client: { companyName: string };
  }>;
  upcomingInspections: Array<{
    id: string;
    status: string;
    startedAt: Date;
    equipment: {
      tag: string;
      client: { companyName: string };
    };
    inspector: { name: string };
  }>;
  activities: Array<{
    id: string;
    action: string;
    entity: string;
    entityName: string;
    userName: string;
    createdAt: Date;
    time: string;
    color: string;
  }>;
  statusData: Array<{ name: string; value: number; color: string }>;
  monthlyData: Array<{ name: string; inspections: number }>;
  equipmentTypeData: Array<{ name: string; value: number }>;
}

export function DashboardClient({
  clientCount,
  equipmentCount,
  userCount,
  totalInspections,
  approvedInspections,
  pendingInspections,
  inProgressInspections,
  rejectedInspections,
  inspections,
  criticalEquipments,
  upcomingInspections,
  activities,
  statusData,
  monthlyData,
  equipmentTypeData,
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: "Dashboard" }]}
        className="mb-2"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visão geral da EngeServ - Última atualização: {new Date().toLocaleString("pt-BR")}
          </p>
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
          subtitle={`${criticalEquipments.length} críticos, ${criticalEquipments.filter(e => e.status === "ATENCAO").length} atenção`}
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
              <PieChartComponent
                data={statusData}
                width="100%"
                height={260}
                showLegend={true}
                innerRadius={60}
                outerRadius={100}
              />
            ) : (
              <div className="text-center text-slate-500 py-8 w-full">Nenhum dado disponível</div>
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
            <LineChartComponent
              data={monthlyData}
              lines={[{ dataKey: "inspections", name: "Inspeções", color: "#1e3a5f", strokeWidth: 3 }]}
              width="100%"
              height={260}
              showLegend={false}
            />
          </div>
        </div>
      </div>

      {/* Segunda linha de gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Equipamentos por Tipo - Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Equipamentos por Tipo</h2>
          <div className="h-64">
            <BarChartComponent
              data={equipmentTypeData}
              width="100%"
              height={260}
              xKey="name"
              yKey="value"
            />
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
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><XCircle className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="font-medium text-rose-800">{rejectedInspections} inspeção(ões) rejeitada(s)</p>
                  <p className="text-sm text-rose-600">Requer ação corretiva ou nova inspeção</p>
                </div>
                <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">Urgente</span>
              </div>
            )}
            {pendingInspections > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-5 h-5" /></div>
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
            {criticalEquipments.length > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertCircle className="w-5 h-5" /></div>
                <div className="flex-1">
                  <p className="font-medium text-rose-800">{criticalEquipments.length} equipamento(s) com espessura crítica</p>
                  <p className="text-sm text-rose-600">Margem de segurança abaixo de 20% ou espessura mínima atingida</p>
                </div>
                <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">Crítico</span>
              </div>
            )}
            {rejectedInspections === 0 && pendingInspections === 0 && inProgressInspections === 0 && criticalEquipments.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="p-3 bg-emerald-50 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-medium text-slate-700">Tudo em ordem!</p>
                <p className="text-sm">Nenhuma ação urgente necessária no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Equipamentos Críticos */}
      {criticalEquipments.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Equipamentos Críticos / Atenção
            </h2>
            <span className="text-xs text-slate-500">{criticalEquipments.length} equipamentos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">TAG</th>
                  <th className="px-5 py-3 text-left">Cliente</th>
                  <th className="px-5 py-3 text-left">Tipo</th>
                  <th className="px-5 py-3 text-left">Esp. Atual (mm)</th>
                  <th className="px-5 py-3 text-left">Esp. Mínima (mm)</th>
                  <th className="px-5 py-3 text-left">Margem (%)</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {criticalEquipments.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">{eq.tag}</td>
                    <td className="px-5 py-4 text-slate-600">{eq.client.companyName}</td>
                    <td className="px-5 py-4 text-slate-600">{getEquipmentTypeLabel(eq.type)}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium">{eq.currentThickness.toFixed(2)}</td>
                    <td className="px-5 py-4 text-slate-600">{eq.minThicknessMm?.toFixed(2) ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={cn("font-medium", eq.status === "CRITICO" && "text-rose-600", eq.status === "ATENCAO" && "text-amber-600")}>
                        {eq.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge 
                        variant={eq.status === "CRITICO" ? "danger" : "warning"} 
                        dot
                      >
                        {eq.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Próximas Inspeções */}
      {upcomingInspections.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Próximas Inspeções
            </h2>
            <Link href="/inspecoes" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">TAG</th>
                  <th className="px-5 py-3 text-left">Cliente</th>
                  <th className="px-5 py-3 text-left">Inspetor</th>
                  <th className="px-5 py-3 text-left">Início</th>
                  <th className="px-5 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingInspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">{insp.equipment.tag}</td>
                    <td className="px-5 py-4 text-slate-600">{insp.equipment.client.companyName}</td>
                    <td className="px-5 py-4 text-slate-600">{insp.inspector.name}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(insp.startedAt)}</td>
                    <td className="px-5 py-4">
                      {(() => {
                        const { bg, text, border } = getStatusColor(insp.status);
                        return (
                          <Badge variant="outline" className={cn(bg, text, border)}>
                            {insp.status.replace("_", " ")}
                          </Badge>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabela de Inspeções Recentes */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-800">Inspeções Recentes</h2>
          <Link href="/inspecoes" className="text-sm text-navy hover:text-brand font-medium flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
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
              {inspections.slice(0, 5).map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-800">{insp.equipment.tag}</td>
                  <td className="px-5 py-4 text-slate-600">
                    <div>{insp.equipment.client.companyName}</div>
                    <div className="text-xs text-slate-400">{getEquipmentTypeLabel(insp.equipment.type)}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{insp.inspector.name}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(insp.startedAt)}</td>
                  <td className="px-5 py-4">
                    {(() => {
                      const { bg, text, border } = getStatusColor(insp.status);
                      return (
                        <Badge variant="outline" className={cn(bg, text, border)}>
                          {insp.status.replace("_", " ")}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    <span className="font-medium">{insp.measurements.length}</span> pontos
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
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

      {/* Últimas Atividades */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Atividade Recente
          </h2>
          <span className="text-xs text-slate-500">Últimos 7 dias</span>
        </div>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 8).map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", act.color)}>
                  {act.action === "inspection" && <ClipboardCheck className="w-4 h-4" />}
                  {act.action === "equipment" && <Box className="w-4 h-4" />}
                  {act.action === "client" && <Building className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">{act.userName}</span>{" "}
                    {act.action === "inspection" && "iniciou inspeção"}
                    {act.action === "equipment" && "cadastrou equipamento"}
                    {act.action === "client" && "cadastrou cliente"}
                    <span className="font-medium text-slate-600"> {act.entityName}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma atividade recente"
            description="As atividades aparecerão aqui conforme a equipe usar o sistema"
            icon={Activity}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/inspecoes/novo" className="group p-4 rounded-lg border border-slate-200 hover:border-navy hover:bg-navy/5 transition-all">
            <div className="p-2 bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <ClipboardCheck className="w-5 h-5 text-blue-600 group-hover:text-white" />
            </div>
            <p className="font-medium text-slate-800">Nova Inspeção</p>
            <p className="text-xs text-slate-500 mt-1">Iniciar inspeção de campo</p>
          </Link>
          <Link href="/equipamentos/novo" className="group p-4 rounded-lg border border-slate-200 hover:border-emerald hover:bg-emerald/5 transition-all">
            <div className="p-2 bg-emerald-100 rounded-lg w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Box className="w-5 h-5 text-emerald-600 group-hover:text-white" />
            </div>
            <p className="font-medium text-slate-800">Novo Equipamento</p>
            <p className="text-xs text-slate-500 mt-1">Cadastrar ativo</p>
          </Link>
          <Link href="/clientes/novo" className="group p-4 rounded-lg border border-slate-200 hover:border-amber hover:bg-amber/5 transition-all">
            <div className="p-2 bg-amber-100 rounded-lg w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Building2 className="w-5 h-5 text-amber-600 group-hover:text-white" />
            </div>
            <p className="font-medium text-slate-800">Novo Cliente</p>
            <p className="text-xs text-slate-500 mt-1">Cadastrar cliente</p>
          </Link>
          <Link href="/configuracoes/textos/novo" className="group p-4 rounded-lg border border-slate-200 hover:border-purple hover:bg-purple/5 transition-all">
            <div className="p-2 bg-purple-100 rounded-lg w-10 h-10 flex items-center justify-center mb-3 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <FileText className="w-5 h-5 text-purple-600 group-hover:text-white" />
            </div>
            <p className="font-medium text-slate-800">Texto Padrão</p>
            <p className="text-xs text-slate-500 mt-1">Biblioteca de laudos</p>
          </Link>
        </div>
      </div>
    </div>
  );
}