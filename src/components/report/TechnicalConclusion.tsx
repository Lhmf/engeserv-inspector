"use client";

import type { TechnicalConclusion } from "@/modules/report/types";
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle, Shield, Lightbulb, FileText, HelpCircle } from "lucide-react";

interface TechnicalConclusionProps {
  conclusion: TechnicalConclusion;
}

export function TechnicalConclusion({ conclusion }: TechnicalConclusionProps) {
  const statusColors = {
    INTEGRO: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ACEITAVEL_COM_RESTRICOES: "bg-amber-100 text-amber-700 border-amber-200",
    REQUER_REPARO: "bg-orange-100 text-orange-700 border-orange-200",
    CONDENADO: "bg-rose-100 text-rose-700 border-rose-200",
    INDETERMINADO: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const statusLabels = {
    INTEGRO: "Íntegro",
    ACEITAVEL_COM_RESTRICOES: "Aceitável com Restrições",
    REQUER_REPARO: "Requer Reparo",
    CONDENADO: "Condenado",
    INDETERMINADO: "Indeterminado",
  };

  const criticalityColors = {
    LOW: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-blue-100 text-blue-700",
    HIGH: "bg-amber-100 text-amber-700",
    CRITICAL: "bg-rose-100 text-rose-700",
    NOT_ASSESSED: "bg-slate-100 text-slate-700",
  };

  const criticalityLabels = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica",
    NOT_ASSESSED: "Não Avaliada",
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Conclusão Técnica</h2>
            <p className="text-sm text-slate-500">Avaliação final da integridade do equipamento</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Status */}
        <div className={`rounded-xl border p-6 ${({
          INTEGRO: "bg-emerald-50 border-emerald-200",
          ACEITAVEL_COM_RESTRICOES: "bg-amber-50 border-amber-200",
          REQUER_REPARO: "bg-orange-50 border-orange-200",
          CONDENADO: "bg-rose-50 border-rose-200",
          INDETERMINADO: "bg-slate-50 border-slate-200",
        }[conclusion.conclusion] || "bg-slate-50 border-slate-200")} border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${({
                INTEGRO: "bg-emerald-100",
                ACEITAVEL_COM_RESTRICOES: "bg-amber-100",
                REQUER_REPARO: "bg-orange-50",
                CONDENADO: "bg-rose-50",
                INDETERMINADO: "bg-slate-100",
              }[conclusion.conclusion] || "bg-slate-100")}`}>
                {({
                  INTEGRO: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
                  ACEITAVEL_COM_RESTRICOES: <AlertTriangle className="w-8 h-8 text-amber-600" />,
                  REQUER_REPARO: <AlertTriangle className="w-8 h-8 text-orange-600" />,
                  CONDENADO: <XCircle className="w-8 h-8 text-rose-600" />,
                  INDETERMINADO: <HelpCircle className="w-8 h-8 text-slate-600" />,
                }[conclusion.conclusion] || <HelpCircle className="w-8 h-8 text-slate-600" />)}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Conclusão Técnica</p>
                <p className="text-2xl font-bold text-slate-800 capitalize">{({
                  INTEGRO: "Íntegro",
                  ACEITAVEL_COM_RESTRICOES: "Aceitável com Restrições",
                  REQUER_REPARO: "Requer Reparo",
                  CONDENADO: "Condenado",
                  INDETERMINADO: "Indeterminado",
                }[conclusion.conclusion] || conclusion.conclusion)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${({
                LOW: "bg-emerald-100 text-emerald-700",
                MEDIUM: "bg-blue-100 text-blue-700",
                HIGH: "bg-amber-100 text-amber-700",
                CRITICAL: "bg-rose-100 text-rose-700",
                NOT_ASSESSED: "bg-slate-100 text-slate-700",
              } as Record<string, string>)["LOW"] || "bg-slate-100 text-slate-700"}`}>
                {({
                  LOW: "Baixa",
                  MEDIUM: "Média",
                  HIGH: "Alta",
                  CRITICAL: "Crítica",
                  NOT_ASSESSED: "Não Avaliada",
                }["LOW"] || "Não Avaliada")}
              </div>
            </div>
          </div>
        </div>

        {/* Justification */}
        {conclusion.justification && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Justificativa Técnica
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{conclusion.justification}</p>
            </div>
          </div>
        )}

        {/* Risk Factors */}
        {conclusion.riskFactors && conclusion.riskFactors.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Fatores de Risco ({conclusion.riskFactors.length})
            </h3>
            <div className="space-y-3">
              {conclusion.riskFactors.map((rf, index) => (
                <div key={index} className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${({
                        CRITICAL: "bg-rose-100 text-rose-700",
                        HIGH: "bg-orange-100 text-orange-700",
                        MEDIUM: "bg-amber-100 text-amber-700",
                        LOW: "bg-emerald-100 text-emerald-700",
                        NOT_ASSESSED: "bg-slate-100 text-slate-700",
                      } as Record<string, string>)[rf.severity] || "bg-slate-100 text-slate-700"}`}>
                        {rf.severity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-rose-800">{rf.factor}</p>
                      <p className="text-sm text-rose-700 mt-1">{rf.description}</p>
                      {rf.mitigation && (
                        <p className="text-sm text-rose-600 mt-2">
                          <span className="font-medium">Mitigação:</span> {rf.mitigation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compliance Statement */}
        {conclusion.complianceStatement && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-800 mb-1">Declaração de Conformidade</p>
                <p className="text-emerald-700">{conclusion.complianceStatement}</p>
              </div>
            </div>
          </div>
        )}

        {/* Restrictions */}
        {conclusion.restrictions && conclusion.restrictions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Restrições de Operação ({conclusion.restrictions.length})
            </h3>
            <ul className="space-y-2">
              {conclusion.restrictions.map((restriction, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-800">{restriction}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}