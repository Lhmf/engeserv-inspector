"use client";

import { TechnicalReport } from "@/modules/report/types";
import { AlertCircle, CheckCircle2, FileText, TrendingUp, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

interface ExecutiveSummaryProps {
  report: TechnicalReport;
  onVerdictChange?: (newStatus: string) => void;
}

export function ExecutiveSummary({ report, onVerdictChange }: ExecutiveSummaryProps) {
  const { executiveSummary } = report;

  const statusColors = {
    INTEGRO: "bg-emerald-100 text-emerald-700",
    ACEITAVEL_COM_RESTRICOES: "bg-amber-100 text-amber-700",
    REQUER_REPARO: "bg-orange-100 text-orange-700",
    CONDENADO: "bg-rose-100 text-rose-700",
    INDETERMINADO: "bg-slate-100 text-slate-700",
  };

  const statusLabels = {
    INTEGRO: "Íntegro",
    ACEITAVEL_COM_RESTRICOES: "Aceitável com Restrições",
    REQUER_REPARO: "Requer Reparo",
    CONDENADO: "Condenado",
    INDETERMINADO: "Indeterminado",
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Resumo Executivo</h2>
            <p className="text-sm text-slate-500">Visão geral dos achados e conclusão da inspeção</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Status */}
        <div className={`px-4 py-3 rounded-lg ${({
          INTEGRO: "bg-emerald-50 border-emerald-200",
          ACEITAVEL_COM_RESTRICOES: "bg-amber-50 border-amber-200",
          REQUER_REPARO: "bg-orange-50 border-orange-200",
          CONDENADO: "bg-rose-50 border-rose-200",
          INDETERMINADO: "bg-slate-50 border-slate-200",
        }[report.executiveSummary.overallStatus] || "bg-slate-50 border-slate-200")} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${({
                INTEGRO: "bg-emerald-100",
                ACEITAVEL_COM_RESTRICOES: "bg-amber-100",
                REQUER_REPARO: "bg-orange-50",
                CONDENADO: "bg-rose-50",
                INDETERMINADO: "bg-slate-100",
              }[report.executiveSummary.overallStatus] || "bg-slate-100")}`}>
                {({
                  INTEGRO: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
                  ACEITAVEL_COM_RESTRICOES: <AlertTriangle className="w-6 h-6 text-amber-600" />,
                  REQUER_REPARO: <AlertTriangle className="w-6 h-6 text-orange-600" />,
                  CONDENADO: <AlertCircle className="w-6 h-6 text-rose-600" />,
                  INDETERMINADO: <HelpCircle className="w-6 h-6 text-slate-600" />,
                }[report.executiveSummary.overallStatus] || <HelpCircle className="w-6 h-6 text-slate-600" />)}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Veredito Técnico</p>
                {onVerdictChange ? (
                  <select
                    value={report.executiveSummary.overallStatus}
                    onChange={(e) => onVerdictChange(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  >
                    <option value="INTEGRO">Aprovado (Íntegro)</option>
                    <option value="ACEITAVEL_COM_RESTRICOES">Aprovado com Restrições</option>
                    <option value="REQUER_REPARO">Reprovado (Requer Reparo)</option>
                    <option value="CONDENADO">Reprovado (Condenado)</option>
                    <option value="INDETERMINADO">Indeterminado</option>
                  </select>
                ) : (
                  <p className="font-semibold text-slate-800 capitalize">{({
                    INTEGRO: "Aprovado",
                    ACEITAVEL_COM_RESTRICOES: "Aprovado com Restrições",
                    REQUER_REPARO: "Reprovado",
                    CONDENADO: "Reprovado",
                    INDETERMINADO: "Indeterminado",
                  }[report.executiveSummary.overallStatus] || report.executiveSummary.overallStatus)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${({
                LOW: "bg-emerald-100 text-emerald-700",
                MEDIUM: "bg-blue-100 text-blue-700",
                HIGH: "bg-amber-100 text-amber-700",
                CRITICAL: "bg-rose-100 text-rose-700",
              }[report.executiveSummary.criticalityLevel] || "bg-slate-100 text-slate-700")}`}>
                {({
                  LOW: "Baixa",
                  MEDIUM: "Média",
                  HIGH: "Alta",
                  CRITICAL: "Crítica",
                }[report.executiveSummary.criticalityLevel] || report.executiveSummary.criticalityLevel)}
              </div>
              {report.executiveSummary.requiresImmediateAction && (
                <span className="px-3 py-1 bg-rose-100 text-rose-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Ação Imediata Necessária
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Overview */}
        {report.executiveSummary.overview && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Visão Geral</h3>
            <p className="text-slate-600 leading-relaxed">{report.executiveSummary.overview}</p>
          </div>
        )}

        {/* Key Findings */}
        {report.executiveSummary.keyFindings.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Principais Achados
            </h3>
            <ul className="space-y-2">
              {report.executiveSummary.keyFindings.map((finding, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm">{finding}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Criticality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{report.engineeringResults?.integrityAnalysis?.overallCriticality === "CRITICAL" ? "Crítica" : report.engineeringResults?.integrityAnalysis?.overallCriticality === "HIGH" ? "Alta" : report.engineeringResults?.integrityAnalysis?.overallCriticality === "MEDIUM" ? "Média" : "Baixa"}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Criticidade Geral</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{report.executiveSummary.criticalityLevel === "CRITICAL" ? "Crítica" : report.executiveSummary.criticalityLevel === "HIGH" ? "Alta" : report.executiveSummary.criticalityLevel === "MEDIUM" ? "Média" : "Baixa"}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Nível de Criticidade</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{report.executiveSummary.requiresImmediateAction ? "Sim" : "Não"}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Ação Imediata</p>
          </div>
        </div>
      </div>
    </section>
  );
}