"use client";

import { MeasurementPoint } from "@/modules/engineering/types";
import { Ruler, Minimize2, Maximize2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Search, Filter, Download } from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";

interface MeasurementTableProps {
  measurements: MeasurementPoint[];
  stats: {
    count: number;
    minThicknessMm: number;
    maxThicknessMm: number;
    avgThicknessMm: number;
    belowMinCount: number;
    belowMinPercentage: number;
  };
}

export const MeasurementTable = memo(function MeasurementTable({ measurements, stats }: MeasurementTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filter, setFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const sortedAndFilteredMeasurements = useMemo(() => {
    let result = [...measurements];

    // Filter by search
    if (filter) {
      result = result.filter(m =>
        m.point.toLowerCase().includes(filter.toLowerCase()) ||
        m.notes?.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof MeasurementPoint];
        const bVal = b[sortConfig.key as keyof MeasurementPoint];
        if (aVal == null || bVal == null) return 0;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [measurements, filter, sortConfig]);

  const handleSort = useCallback((key: keyof MeasurementPoint) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const getStatusConfig = (thicknessMm: number, minThicknessMm?: number) => {
    if (minThicknessMm && thicknessMm <= minThicknessMm) {
      return { badge: "bg-rose-100 text-rose-700", icon: <AlertTriangle className="w-4 h-4 text-rose-600" />, label: "Crítico" };
    }
    if (minThicknessMm && thicknessMm <= minThicknessMm * 1.2) {
      return { badge: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, label: "Atenção" };
    }
    return { badge: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />, label: "OK" };
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ruler className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Medições de Espessura</h2>
              <p className="text-sm text-slate-500">Resultados das medições ultrassônicas</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por ponto ou nota..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
            <p className="text-xs text-slate-500">Total de Pontos</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.avgThicknessMm.toFixed(1)} mm</p>
            <p className="text-xs text-slate-500">Espessura Média</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.minThicknessMm.toFixed(1)}</p>
            <p className="text-xs text-slate-500">Mínima (mm)</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.maxThicknessMm.toFixed(1)}</p>
            <p className="text-xs text-slate-500">Máxima (mm)</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${stats.belowMinCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>{stats.belowMinCount}</p>
            <p className="text-xs text-slate-500">Abaixo do Mínimo</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className={`text-2xl font-bold ${stats.belowMinPercentage > 0 ? "text-rose-600" : "text-emerald-600"}`}>{stats.belowMinPercentage.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">% Abaixo do Mínimo</p>
          </div>
        </div>
      </div>

      {/* Mobile cards (< md) */}
      <div className="grid gap-3 p-4 md:hidden">
        {sortedAndFilteredMeasurements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center text-slate-500">
            <Ruler className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600 mb-2">Nenhuma medição encontrada</p>
            <p className="text-sm">Tente ajustar os filtros ou verifique se há medições cadastradas.</p>
          </div>
        ) : (
          sortedAndFilteredMeasurements.map((measurement) => {
            const statusConfig = getStatusConfig(measurement.thicknessMm, stats?.minThicknessMm || 0);
            return (
              <div key={measurement.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-slate-800">{measurement.point}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {measurement.angleDeg !== undefined ? `${measurement.angleDeg}°` : "Ângulo: —"}
                    </p>
                  </div>
                  <span className={`inline-flex flex-shrink-0 items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                    {statusConfig.icon}
                    <span>{statusConfig.label}</span>
                  </span>
                </div>
                <div className={`mt-3 rounded-lg px-4 py-3 text-center ${measurement.thicknessMm < 6 ? "bg-rose-50" : measurement.thicknessMm < 7 ? "bg-amber-50" : "bg-slate-50"}`}>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Espessura</p>
                  <p className={`font-mono text-2xl font-bold ${measurement.thicknessMm < 6 ? "text-rose-600" : measurement.thicknessMm < 7 ? "text-amber-600" : "text-slate-800"}`}>
                    {measurement.thicknessMm.toFixed(1)} mm
                  </p>
                </div>
                {measurement.notes && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    {measurement.notes}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {[
                { key: "point", label: "Ponto", width: "w-24" },
                { key: "thicknessMm", label: "Espessura (mm)", width: "w-32" },
                { key: "angleDeg", label: "Ângulo (°)", width: "w-24" },
                { key: "status", label: "Status", width: "w-28" },
                { key: "notes", label: "Observações", width: "w-auto" },
                { key: "actions", label: "", width: "w-16" },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 ${col.width}`}
                  onClick={() => handleSort(col.key as keyof MeasurementPoint)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sortConfig?.key === col.key && (
                      <span className="w-4 h-4 flex items-center justify-center">
                        {sortConfig.direction === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedAndFilteredMeasurements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center">
                <div className="text-center text-slate-500">
                  <Ruler className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-600 mb-2">Nenhuma medição encontrada</p>
                  <p className="text-slate-500">Tente ajustar os filtros ou verifique se há medições cadastradas.</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedAndFilteredMeasurements.map((measurement) => {
              const statusConfig = getStatusConfig(measurement.thicknessMm, stats?.minThicknessMm || 0);
              const isExpanded = expandedRow === measurement.id;

              return (
                <>
                  <tr
                    key={measurement.id}
                    className={`hover:bg-slate-50 transition-colors ${statusConfig.label === "Crítico" ? "bg-rose-50" : statusConfig.label === "Atenção" ? "bg-amber-50" : ""}`}
                    onClick={() => setExpandedRow(isExpanded ? null : measurement.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-slate-800">{measurement.point}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-semibold ${measurement.thicknessMm < 6 ? 'text-rose-600' : measurement.thicknessMm < 7 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {measurement.thicknessMm.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm">
                      {measurement.angleDeg !== undefined ? `${measurement.angleDeg}°` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                        {statusConfig.icon}
                        <span>{statusConfig.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm max-w-xs truncate">
                      {measurement.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRow(expandedRow === measurement.id ? null : measurement.id);
                        }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 active:scale-95"
                        aria-label={expandedRow === measurement.id ? "Recolher" : "Expandir"}
                      >
                        {expandedRow === measurement.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Espessura</p>
                              <p className="font-mono font-bold text-lg text-slate-800">{measurement.thicknessMm.toFixed(1)} mm</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Ângulo</p>
                              <p className="font-medium text-slate-800">{measurement.angleDeg !== undefined ? `${measurement.angleDeg}°` : "Não informado"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                              <p className="font-medium capitalize">{getStatusConfig(measurement.thicknessMm, stats?.minThicknessMm || 0).label}</p>
                            </div>
                          </div>
                          {measurement.notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observações</p>
                              <p className="text-slate-700">{measurement.notes}</p>
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <p>Criado: {measurement.createdAt ? new Date(measurement.createdAt).toLocaleString("pt-BR") : "—"}</p>
                            <span className="mx-2">•</span>
                            <p>Atualizado: {measurement.updatedAt ? new Date(measurement.updatedAt).toLocaleString("pt-BR") : "—"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination placeholder */}
      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Mostrando {sortedAndFilteredMeasurements.length} de {stats.count} medições
        </p>
        <div className="flex items-center gap-2">
          <button className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50 active:scale-95">Anterior</button>
          <button className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm transition-colors hover:bg-slate-50 disabled:opacity-50 active:scale-95">Próximo</button>
        </div>
      </div>
    </section>
  );
});