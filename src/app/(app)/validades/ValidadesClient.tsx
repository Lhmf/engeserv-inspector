"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Eye,
} from "lucide-react";
import {
  calcularProximaData,
  getValidadeStatus,
  ordenarPorVencimento,
  type ValidadeStatus,
} from "@/lib/validades";

interface ValidadeItem {
  equipmentId: string;
  equipmentTag: string;
  equipmentType: string;
  clientId: string;
  clientName: string;
  lastApprovedAt: Date | null;
  periodicityMonths: number | null;
}

interface ClientItem {
  id: string;
  companyName: string;
}

const STATUS_LABELS: Record<ValidadeStatus, string> = {
  VENCIDO: "Vencido",
  PROXIMO: "Próximo",
  OK: "OK",
  SEM_DATA: "Sem data",
};

const STATUS_COLORS: Record<ValidadeStatus, string> = {
  VENCIDO: "bg-rose-100 text-rose-700 border-rose-200",
  PROXIMO: "bg-amber-100 text-amber-700 border-amber-200",
  OK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SEM_DATA: "bg-slate-100 text-slate-500 border-slate-200",
};

export function ValidadesClient({
  validades,
  clients,
}: {
  validades: ValidadeItem[];
  clients: ClientItem[];
}) {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ValidadeStatus>("all");

  const items = useMemo(() => {
    const mapped = validades.map((v) => {
      const nextDueDate = calcularProximaData(v.lastApprovedAt, v.periodicityMonths);
      return {
        ...v,
        nextDueDate,
        status: getValidadeStatus(nextDueDate),
      };
    });

    return ordenarPorVencimento(mapped).filter((item) => {
      const matchSearch =
        !search ||
        item.equipmentTag.toLowerCase().includes(search.toLowerCase()) ||
        item.clientName.toLowerCase().includes(search.toLowerCase());

      const matchClient = clientFilter === "all" || item.clientId === clientFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchClient && matchStatus;
    });
  }, [validades, search, clientFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = validades.length;
    const vencido = validades.filter(
      (v) => getValidadeStatus(calcularProximaData(v.lastApprovedAt, v.periodicityMonths)) === "VENCIDO"
    ).length;
    const proximo = validades.filter(
      (v) => getValidadeStatus(calcularProximaData(v.lastApprovedAt, v.periodicityMonths)) === "PROXIMO"
    ).length;
    const ok = validades.filter(
      (v) => getValidadeStatus(calcularProximaData(v.lastApprovedAt, v.periodicityMonths)) === "OK"
    ).length;
    const semData = validades.filter(
      (v) => getValidadeStatus(calcularProximaData(v.lastApprovedAt, v.periodicityMonths)) === "SEM_DATA"
    ).length;
    return { total, vencido, proximo, ok, semData };
  }, [validades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Validades</h1>
        <p className="text-sm text-slate-500">
          Calendário e gestão de vencimento dos laudos ativos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold text-slate-800">{counts.total}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-rose-600 font-medium">Vencidos</p>
          <p className="text-2xl font-bold text-rose-700">{counts.vencido}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-amber-600 font-medium">Próximos</p>
          <p className="text-2xl font-bold text-amber-700">{counts.proximo}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-emerald-600 font-medium">OK</p>
          <p className="text-2xl font-bold text-emerald-700">{counts.ok}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Sem Data</p>
          <p className="text-2xl font-bold text-slate-800">{counts.semData}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por TAG, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ValidadeStatus)}
            className="w-full sm:w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">Todos os status</option>
            <option value="VENCIDO">Vencido</option>
            <option value="PROXIMO">Próximo</option>
            <option value="OK">OK</option>
            <option value="SEM_DATA">Sem data</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            title={
              search || clientFilter !== "all" || statusFilter !== "all"
                ? "Nenhum equipamento encontrado"
                : "Nenhum equipamento cadastrado"
            }
            description={
              search || clientFilter !== "all" || statusFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Cadastre equipamentos para acompanhar as validades"
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">TAG</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Última Aprovação</th>
                  <th className="px-4 py-3 text-left">Periodicidade</th>
                  <th className="px-4 py-3 text-left">Próximo Vencimento</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.equipmentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.equipmentTag}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.equipmentType.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.clientName}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.lastApprovedAt ? formatDate(item.lastApprovedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.periodicityMonths
                        ? `${item.periodicityMonths} meses`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.nextDueDate ? formatDate(item.nextDueDate) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={STATUS_COLORS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/equipamentos/${item.equipmentId}`}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors inline-block"
                        title="Ver Equipamento"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
