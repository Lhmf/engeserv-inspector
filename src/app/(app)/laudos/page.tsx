"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Eye,
  ArrowRight,
  AlertCircle,
  Download,
  FileOutput,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LaudoItem {
  id: string;
  reportNumber: string;
  equipmentTag: string;
  clientName: string;
  status: string;
  version: number;
  createdAt: string;
  inspectionDate: string;
  type: "EXISTING" | "READY_TO_GENERATE";
  inspectionId?: string;
}

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  UNDER_REVIEW: "Em Revisão",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
  PRONTO_PARA_GERAR: "Pronto para gerar",
};

const statusColor: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ARCHIVED: "bg-slate-100 text-slate-500 border-slate-200",
  PRONTO_PARA_GERAR: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function LaudosPage() {
  const [laudos, setLaudos] = useState<LaudoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLaudos();
  }, []);

  async function loadLaudos() {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, readyRes] = await Promise.all([
        fetch("/api/reports/list"),
        fetch("/api/reports/ready"),
      ]);

      if (!reportsRes.ok) throw new Error("Erro ao carregar laudos");

      const reportsData = await reportsRes.json();
      const readyData = await readyRes.json();

      const existingReports: LaudoItem[] = (reportsData.reports || []).map((r: any) => ({
        id: r.id,
        reportNumber: r.reportNumber,
        equipmentTag: r.equipmentTag,
        clientName: r.clientName,
        status: r.status,
        version: r.version,
        createdAt: r.createdAt,
        inspectionDate: r.inspectionDate,
        type: "EXISTING",
      }));

      const readyToGenerate: LaudoItem[] = (readyData.items || []).map((i: any) => ({
        id: i.inspectionId || i.id,
        reportNumber: `— (${i.equipmentTag})`,
        equipmentTag: i.equipmentTag,
        clientName: i.clientName,
        status: "PRONTO_PARA_GERAR",
        version: 0,
        createdAt: i.approvedAt || new Date().toISOString(),
        inspectionDate: i.approvedAt || new Date().toISOString(),
        type: "READY_TO_GENERATE",
        inspectionId: i.inspectionId || i.id,
      }));

      const allItems = [...existingReports, ...readyToGenerate].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setLaudos(allItems);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = laudos.filter(
    (l) =>
      l.equipmentTag.toLowerCase().includes(search.toLowerCase()) ||
      l.clientName.toLowerCase().includes(search.toLowerCase()) ||
      l.reportNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Laudos Técnicos</h1>
          <p className="text-sm text-slate-500">
            Laudos gerados e inspeções prontas para gerar laudo
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por TAG, cliente, número do laudo..."
            aria-label="Buscar laudos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} columns={5} className="m-4" />
        ) : error ? (
          <div className="p-12 flex flex-col items-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8" />
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Nenhum laudo disponível"
            description={
              search ? "Tente ajustar a busca" : "Os laudos gerados e inspeções prontas aparecerão aqui"
            }
            action={{
              label: "Ir para Inspeções",
              href: "/inspecoes",
            }}
          />
        ) : (
          <>
            {/* Mobile cards (< md) */}
            <div className="space-y-3 p-4 md:hidden">
              {filtered.map((laudo) => (
                <div
                  key={laudo.id}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
                    laudo.type === "READY_TO_GENERATE" && "border-l-4 border-l-emerald-500"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            laudo.type === "READY_TO_GENERATE" ? "text-emerald-600" : "text-navy"
                          )}
                        />
                        <span className="truncate font-medium text-slate-800">{laudo.reportNumber}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-500">{laudo.clientName}</p>
                    </div>
                    <Badge variant="outline" className={statusColor[laudo.status] || statusColor.DRAFT}>
                      {statusLabel[laudo.status] || laudo.status}
                    </Badge>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs uppercase text-slate-400">Equipamento</p>
                    <p className="text-sm font-medium text-slate-700">{laudo.equipmentTag}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatDate(laudo.inspectionDate)}</span>
                    {laudo.type === "EXISTING" ? (
                      <Link
                        href={`/reports/${laudo.id}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar
                      </Link>
                    ) : (
                      <Button
                        onClick={() => window.location.href = `/reports/new?inspectionId=${laudo.inspectionId}`}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                      >
                        <FileOutput className="w-4 h-4" />
                        Gerar Laudo
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table (md+) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Laudo</th>
                    <th className="px-4 py-3 text-left">Equipamento</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((laudo) => (
                    <tr
                      key={laudo.id}
                      className={cn(
                        "hover:bg-slate-50",
                        laudo.type === "READY_TO_GENERATE" && "bg-emerald-50/50"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText
                            className={cn(
                              "w-4 h-4",
                              laudo.type === "READY_TO_GENERATE" ? "text-emerald-600" : "text-navy"
                            )}
                          />
                          <span className="font-medium text-slate-800">{laudo.reportNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{laudo.equipmentTag}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="block max-w-[220px] truncate">{laudo.clientName}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(laudo.inspectionDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusColor[laudo.status] || statusColor.DRAFT}>
                          {statusLabel[laudo.status] || laudo.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {laudo.type === "EXISTING" ? (
                          <Link
                            href={`/reports/${laudo.id}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy/90 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Visualizar
                          </Link>
                        ) : (
                          <Button
                            onClick={() => window.location.href = `/reports/new?inspectionId=${laudo.inspectionId}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                          >
                            <FileOutput className="w-4 h-4" />
                            Gerar Laudo
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}