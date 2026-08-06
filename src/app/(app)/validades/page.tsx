"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable, SkeletonKpiCard } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import type { ValidadeStatus } from "@/lib/validades";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Eye,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidadeItem {
  equipmentId: string;
  equipmentTag: string;
  equipmentType: string;
  clientId?: string;
  clientName: string;
  lastApprovedAt: Date | null;
  periodicityMonths: number | null;
  nextDueDate: Date | null;
  status: ValidadeStatus;
}

const STATUS_LABELS: Record<ValidadeStatus, string> = {
  VENCIDO: "Vencido",
  PROXIMO: "Próximo (60 dias)",
  OK: "Em dia",
  SEM_DATA: "Sem data",
};

const STATUS_COLORS: Record<ValidadeStatus, string> = {
  VENCIDO: "bg-rose-100 text-rose-700 border-rose-200",
  PROXIMO: "bg-amber-100 text-amber-700 border-amber-200",
  OK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SEM_DATA: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_BG: Record<ValidadeStatus, string> = {
  VENCIDO: "border-l-rose-500",
  PROXIMO: "border-l-amber-500",
  OK: "border-l-emerald-500",
  SEM_DATA: "border-l-slate-400",
};

export default function ValidadesPage() {
  const [validades, setValidades] = useState<ValidadeItem[]>([]);
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ValidadeStatus>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [valRes, cliRes] = await Promise.all([
        fetch("/api/validades"),
        fetch("/api/clientes"),
      ]);

      if (!valRes.ok) throw new Error("Erro ao carregar validades");

      const valData = await valRes.json();
      const cliData = await cliRes.json();

      setValidades(valData.validades || []);
      setClients(cliData.clientes?.filter((c: any) => c.active) || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = validades
    .filter((v) => {
      if (search && !v.equipmentTag.toLowerCase().includes(search.toLowerCase()) && !v.clientName.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (clientFilter !== "all" && v.clientId !== clientFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (!a.nextDueDate && !b.nextDueDate) return 0;
      if (!a.nextDueDate) return 1;
      if (!b.nextDueDate) return -1;
      return a.nextDueDate.getTime() - b.nextDueDate.getTime();
    });

  // Alert counts
  const alert90 = validades.filter((v) => {
    if (!v.nextDueDate) return false;
    const days = (v.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 90;
  }).length;
  const alert60 = validades.filter((v) => {
    if (!v.nextDueDate) return false;
    const days = (v.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 60;
  }).length;
  const alert30 = validades.filter((v) => {
    if (!v.nextDueDate) return false;
    const days = (v.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Validades</h1>
          <p className="text-sm text-slate-500">
            Controle de vencimento dos laudos e inspeções
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "secondary"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Calendário
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Equipamentos" value={validades.length} color="slate" />
        <StatCard label="Vencidos" value={validades.filter((v) => v.status === "VENCIDO").length} color="rose" />
        <StatCard label="Próximos (60d)" value={validades.filter((v) => v.status === "PROXIMO").length} color="amber" />
        <StatCard label="Em dia" value={validades.filter((v) => v.status === "OK").length} color="emerald" />
        <StatCard label="Sem data" value={validades.filter((v) => v.status === "SEM_DATA").length} color="slate" />
      </div>

      {/* Alertas */}
      {alert30 > 0 && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <strong>{alert30} equipamento(s) vencem nos próximos 30 dias!</strong>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por TAG, cliente..."
              aria-label="Buscar validades"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            aria-label="Filtrar por cliente"
            className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">Todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | ValidadeStatus)}
            aria-label="Filtrar por status de validade"
            className="w-full sm:w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">Todos os status</option>
            <option value="VENCIDO">Vencido</option>
            <option value="PROXIMO">Próximo</option>
            <option value="OK">Em dia</option>
            <option value="SEM_DATA">Sem data</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonKpiCard key={i} />)}
          </div>
          <SkeletonTable rows={6} columns={6} />
        </div>
      ) : error ? (
        <div className="p-12 flex flex-col items-center gap-3 text-rose-600">
          <AlertCircle className="w-8 h-8" />
          <p>{error}</p>
        </div>
      ) : viewMode === "list" ? (
        <ValidadeTable items={filtered} />
      ) : (
        <ValidadeCalendar items={filtered} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    slate: "border-slate-200",
    rose: "border-rose-200 bg-rose-50",
    amber: "border-amber-200 bg-amber-50",
    emerald: "border-emerald-200 bg-emerald-50",
  };
  return (
    <div className={cn("rounded-xl border bg-white p-4 shadow-sm", colors[color])}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={cn("text-2xl font-bold", color === "rose" ? "text-rose-700" : color === "amber" ? "text-amber-700" : color === "emerald" ? "text-emerald-700" : "text-slate-800")}>
        {value}
      </p>
    </div>
  );
}

function ValidadeTable({ items }: { items: ValidadeItem[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {items.length === 0 ? (
        <EmptyState title="Nenhum equipamento encontrado" description="Tente ajustar os filtros" />
      ) : (
        <>
          {/* Mobile cards (< md) */}
          <div className="space-y-3 p-4 md:hidden">
            {items.map((item) => {
              const daysLeft = item.nextDueDate
                ? Math.ceil((item.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div
                  key={item.equipmentId}
                  className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", item.status === "VENCIDO" && "border-l-4 border-l-rose-500")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{item.equipmentTag}</p>
                      <p className="truncate text-sm text-slate-500">{item.equipmentType.replace(/_/g, " ")}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
                    <div>
                      <p className="text-xs uppercase text-slate-400">Cliente</p>
                      <p className="truncate text-slate-700">{item.clientName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Próxima</p>
                      <p className="text-slate-700">{item.nextDueDate ? formatDate(item.nextDueDate) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Última</p>
                      <p className="text-slate-700">{item.lastApprovedAt ? formatDate(item.lastApprovedAt) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Prazo</p>
                      <p className={cn("font-medium", daysLeft !== null && daysLeft <= 0 ? "text-rose-600" : daysLeft !== null && daysLeft <= 60 ? "text-amber-600" : "text-slate-700")}>
                        {daysLeft !== null ? (daysLeft <= 0 ? `${Math.abs(daysLeft)}d vencido` : `${daysLeft}d`) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/equipamentos/${item.equipmentId}`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver equipamento
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table (md+) */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">TAG</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Última</th>
                  <th className="px-4 py-3 text-left">Próxima</th>
                  <th className="px-4 py-3 text-left">Dias</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const daysLeft = item.nextDueDate
                    ? Math.ceil((item.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <tr key={item.equipmentId} className={cn("hover:bg-slate-50", item.status === "VENCIDO" && "bg-rose-50/50")}>
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{item.equipmentTag}</td>
                      <td className="px-4 py-3 text-slate-600"><span className="block max-w-[150px] truncate">{item.equipmentType.replace(/_/g, " ")}</span></td>
                      <td className="px-4 py-3 text-slate-600"><span className="block max-w-[180px] truncate">{item.clientName}</span></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.lastApprovedAt ? formatDate(item.lastApprovedAt) : "—"}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.nextDueDate ? formatDate(item.nextDueDate) : "—"}</td>
                      <td className="px-4 py-3">
                        {daysLeft !== null ? (
                          <span className={cn("font-medium", daysLeft <= 0 ? "text-rose-600" : daysLeft <= 60 ? "text-amber-600" : "text-slate-600")}>
                            {daysLeft <= 0 ? `${Math.abs(daysLeft)}d vencido` : `${daysLeft}d`}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={STATUS_COLORS[item.status]}>
                          {STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/equipamentos/${item.equipmentId}`}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-navy/90 active:scale-95 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ValidadeCalendar({ items }: { items: ValidadeItem[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Build an object: "YYYY-MM-DD" -> ValidadeItem[]
  const eventsByDay: Record<string, ValidadeItem[]> = {};
  items.forEach((item) => {
    if (!item.nextDueDate) return;
    const key = `${item.nextDueDate.getFullYear()}-${String(item.nextDueDate.getMonth() + 1).padStart(2, "0")}-${String(item.nextDueDate.getDate()).padStart(2, "0")}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(item);
  });

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Month header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button
          onClick={prevMonth}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-slate-800">{monthNames[month]} {year}</h3>
        <button
          onClick={nextMonth}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-500 py-2 border-b border-slate-100">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[80px] p-1 border-b border-r border-slate-100" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDay[key] || [];
          const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;

          return (
            <div key={day} className={cn("min-h-[80px] p-1 border-b border-r border-slate-100", isToday && "bg-navy/5")}>
              <span className={cn("inline-flex items-center justify-center w-6 h-6 text-xs rounded-full", isToday && "bg-navy text-white font-bold")}>
                {day}
              </span>
              {dayEvents.slice(0, 3).map((ev) => (
                <Link key={ev.equipmentId} href={`/equipamentos/${ev.equipmentId}`}
                  className={cn("flex min-h-7 items-center rounded px-1 text-[10px] leading-tight truncate mt-0.5 active:opacity-70", ev.status === "VENCIDO" ? "bg-rose-100 text-rose-700" : ev.status === "PROXIMO" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}
                >
                  {ev.equipmentTag}
                </Link>
              ))}
              {dayEvents.length > 3 && (
                <span className="text-[10px] text-slate-400 ml-1">+{dayEvents.length - 3}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
