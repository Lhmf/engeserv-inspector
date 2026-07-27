"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Building2,
  Box,
  ClipboardCheck,
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { cn, formatDate, getStatusColor, getEquipmentTypeLabel } from "@/lib/utils";

export default function InspecoesPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    setLoading(true);
    try {
      const res = await fetch("/api/inspections");
      const data = await res.json();
      setInspections(data.inspections || []);
    } catch (e) {
      console.error("Erro ao carregar inspeções:", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredInspections = inspections.filter((insp) => {
    const matchesSearch = 
      insp.equipment.tag.toLowerCase().includes(search.toLowerCase()) ||
      insp.equipment.client.companyName.toLowerCase().includes(search.toLowerCase()) ||
      insp.inspector.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || insp.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = inspections.reduce((acc, insp) => {
    acc[insp.status] = (acc[insp.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Inspeções</h1>
          <p className="text-sm text-slate-500">Histórico de inspeções, medições de espessura e fotos por equipamento</p>
        </div>
        <Link
          href="/inspecoes/novo"
          className="w-full sm:w-auto"
        >
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Inspeção
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total de Inspeções"
          value={inspections.length}
          icon={ClipboardCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Em Andamento"
          value={statusCounts.EM_ANDAMENTO || 0}
          icon={ClipboardCheck}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Aguardando Aprovação"
          value={statusCounts.AGUARDANDO_APROVACAO || 0}
          icon={Calendar}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Aprovadas"
          value={statusCounts.APROVADA || 0}
          icon={ClipboardCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Rejeitadas"
          value={statusCounts.REJEITADA || 0}
          icon={ClipboardCheck}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por TAG, cliente, inspetor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">Todos os status</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
            <option value="APROVADA">Aprovada</option>
            <option value="REJEITADA">Rejeitada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filteredInspections.length === 0 ? (
          <EmptyState
            title={search || statusFilter !== "all" ? "Nenhuma inspeção encontrada" : "Nenhuma inspeção cadastrada"}
            description={search || statusFilter !== "all" 
              ? "Tente ajustar os filtros de busca" 
              : "Comece criando a primeira inspeção"}
            action={{
              label: "Nova Inspeção",
              href: "/inspecoes/novo"
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">TAG</th>
                  <th className="px-4 py-3 text-left">Equipamento / Cliente</th>
                  <th className="px-4 py-3 text-left">Inspetor</th>
                  <th className="px-4 py-3 text-left">Início</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Medições</th>
                  <th className="px-4 py-3 text-left">Fotos</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{insp.equipment.tag}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{getEquipmentTypeLabel(insp.equipment.type)}</div>
                      <div className="text-xs text-slate-400">{insp.equipment.client.companyName}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{insp.inspector.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(insp.startedAt)}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const { bg, text, border } = getStatusColor(insp.status);
                        return (
                          <Badge variant="outline" className={cn(bg, text, border)}>
                            {insp.status.replace("_", " ")}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium">{insp._count?.measurements || 0}</span> pontos
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium">{insp._count?.photos || 0}</span> fotos
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/inspecoes/${insp.id}/wizard`}
                          className="p-2 rounded-lg text-slate-500 hover:text-navy hover:bg-navy/10 transition-colors"
                          title="Abrir Wizard"
                        >
                          <ClipboardCheck className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/inspecoes/${insp.id}`}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </div>
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