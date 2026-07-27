"use client";

import { IntegrityAnalysis } from "@/modules/engineering/types";
import { FormattedCalculation, FormattedSimulation } from "@/modules/report/types";
import { Calculator, AlertTriangle, CheckCircle2, TrendingUp, AlertCircle, Clock, Gauge, BarChart2, Target, HelpCircle, Slash, GitBranch, BookOpen } from "lucide-react";

interface EngineeringAnalysisCardProps {
  analysis: IntegrityAnalysis;
  calculations: FormattedCalculation[];
  simulations?: FormattedSimulation[];
}

export function EngineeringAnalysisCard({ analysis, calculations, simulations }: EngineeringAnalysisCardProps) {
  const statusColors = {
    INTEGRO: "bg-emerald-100 text-emerald-700",
    ACEITAVEL_COM_RESTRICOES: "bg-amber-100 text-amber-700",
    REQUER_REPARO: "bg-orange-100 text-orange-700",
    CONDENADO: "bg-rose-100 text-rose-700",
    INDETERMINADO: "bg-slate-100 text-slate-700",
  };

  const criticalityColors = {
    CRITICAL: "bg-rose-100 text-rose-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-emerald-100 text-emerald-700",
    NOT_ASSESSED: "bg-slate-100 text-slate-700",
  };

  const reliabilityColors = {
    HIGH: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-orange-100 text-orange-700",
    THEORETICAL: "bg-slate-100 text-slate-700",
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "WARNING": return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "ERROR": return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case "INSUFFICIENT_DATA": return <HelpCircle className="w-4 h-4 text-slate-500" />;
      case "NOT_APPLICABLE": return <Slash className="w-4 h-4 text-slate-400" />;
      default: return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Resultados da Engenharia</h2>
              <p className="text-sm text-slate-500">Análise de integridade e cálculos executados</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${({
              INTEGRO: "bg-emerald-100 text-emerald-700",
              ACEITAVEL_COM_RESTRICOES: "bg-amber-100 text-amber-700",
              REQUER_REPARO: "bg-orange-100 text-orange-700",
              CONDENADO: "bg-rose-100 text-rose-700",
              INDETERMINADO: "bg-slate-100 text-slate-700",
            }[analysis.overallStatus] || "bg-slate-100 text-slate-700")}`}>
              {({
                INTEGRO: "Íntegro",
                ACEITAVEL_COM_RESTRICOES: "Aceitável c/ Restrições",
                REQUER_REPARO: "Requer Reparo",
                CONDENADO: "Condenado",
                INDETERMINADO: "Indeterminado",
              }[analysis.overallStatus] || analysis.overallStatus)}
            </span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${({
              CRITICAL: "bg-rose-100 text-rose-700",
              HIGH: "bg-orange-100 text-orange-700",
              MEDIUM: "bg-amber-100 text-amber-700",
              LOW: "bg-emerald-100 text-emerald-700",
              NOT_ASSESSED: "bg-slate-100 text-slate-700",
            }[analysis.overallCriticality] || "bg-slate-100 text-slate-700")}`}>
              {({
                CRITICAL: "Crítica",
                HIGH: "Alta",
                MEDIUM: "Média",
                LOW: "Baixa",
                NOT_ASSESSED: "Não Avaliada",
              }[analysis.overallCriticality] || analysis.overallCriticality)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Risk Factors */}
        {analysis.riskFactors && analysis.riskFactors.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Fatores de Risco ({analysis.riskFactors.length})
            </h3>
            <div className="space-y-2">
              {analysis.riskFactors.map((rf, index) => (
                <div key={index} className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${({
                        CRITICAL: "bg-rose-100 text-rose-700",
                        HIGH: "bg-orange-100 text-orange-700",
                        MEDIUM: "bg-amber-100 text-amber-700",
                        LOW: "bg-emerald-100 text-emerald-700",
                        NOT_ASSESSED: "bg-slate-100 text-slate-700",
                      }[rf.severity] || "bg-slate-100 text-slate-700")}`}>
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

        {/* Calculations */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            Cálculos Executados ({calculations.length})
          </h3>
          <div className="space-y-3">
            {calculations.map((calc) => (
              <div key={calc.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-navy/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-800">{calc.label}</h4>
                      {({
                        SUCCESS: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                        WARNING: <AlertTriangle className="w-4 h-4 text-amber-600" />,
                        ERROR: <AlertCircle className="w-4 h-4 text-rose-600" />,
                        INSUFFICIENT_DATA: <HelpCircle className="w-4 h-4 text-slate-500" />,
                        NOT_APPLICABLE: <Slash className="w-4 h-4 text-slate-400" />,
                      }[calc.status] || <HelpCircle className="w-4 h-4 text-slate-400" />)}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${({
                        SUCCESS: "bg-emerald-100 text-emerald-700",
                        WARNING: "bg-amber-100 text-amber-700",
                        ERROR: "bg-rose-100 text-rose-700",
                        INSUFFICIENT_DATA: "bg-slate-100 text-slate-700",
                        NOT_APPLICABLE: "bg-slate-100 text-slate-700",
                      }[calc.status] || "bg-slate-100 text-slate-700")}`}>
                        {calc.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{calc.explanation}</p>
                    <p className="text-xs text-slate-500 mt-1">{calc.normativeReference}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono text-slate-800">{calc.value}</p>
                      <p className="text-xs text-slate-500">{calc.unit}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${({
                        CRITICAL: "bg-rose-100 text-rose-700",
                        HIGH: "bg-emerald-100 text-emerald-700",
                        MEDIUM: "bg-amber-100 text-amber-700",
                        LOW: "bg-slate-100 text-slate-700",
                        NOT_ASSESSED: "bg-slate-100 text-slate-700",
                      }[calc.criticality] || "bg-slate-100 text-slate-700")}`}>
                        {({
                          CRITICAL: "Crítica",
                          HIGH: "Alta",
                          MEDIUM: "Média",
                          LOW: "Baixa",
                          NOT_ASSESSED: "Não Avaliada",
                        }[calc.criticality] || calc.criticality)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${({
                        HIGH: "bg-emerald-100 text-emerald-700",
                        MEDIUM: "bg-blue-100 text-blue-700",
                        LOW: "bg-amber-100 text-amber-700",
                        THEORETICAL: "bg-slate-100 text-slate-700",
                      }[calc.reliability] || "bg-slate-100 text-slate-700")}`}>
                        {calc.reliability}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="font-medium">Referência:</span>
                  <span>{calc.normativeReference}</span>
                  {calc.observations.length > 0 && (
                    <>
                      <span className="font-medium">Obs:</span>
                      <span>{calc.observations.join("; ")}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulations */}
        {simulations && simulations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Simulações ({simulations.length})
            </h3>
            <div className="space-y-3">
              {simulations.map((sim) => (
                <div key={sim.scenario} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-slate-800 capitalize">{sim.scenario.replace("_", " ").toLowerCase()}</h4>
                      <p className="text-sm text-slate-600 mt-1">Projeção para {new Date(sim.projectedDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">{sim.projectedThicknessMm.toFixed(1)} mm</p>
                      <p className="text-xs text-slate-500">Espessura projetada</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white rounded p-3">
                      <p className="text-2xl font-bold text-slate-800">{sim.remainingLifeYears.toFixed(1)}</p>
                      <p className="text-xs text-slate-500">Anos de vida útil</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-2xl font-bold text-slate-800">{sim.recommendedInspectionIntervalMonths}</p>
                      <p className="text-xs text-slate-500">Meses p/ inspeção</p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-2xl font-bold {sim.willReachMinThickness ? 'text-rose-600' : 'text-emerald-600'}">
                        {sim.willReachMinThickness ? "Sim" : "Não"}
                      </p>
                      <p className="text-xs text-slate-500">Atinge esp. mínima</p>
                    </div>
                    {sim.estimatedDateMinThickness && (
                      <div className="bg-white rounded p-3">
                        <p className="text-lg font-bold text-slate-800">{new Date(sim.estimatedDateMinThickness).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs text-slate-500">Data esp. mínima</p>
                      </div>
                    )}
                  </div>
                  {sim.warnings.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800 font-medium mb-1">Avisos:</p>
                      <ul className="text-xs text-amber-700 space-y-1">
                        {sim.warnings.map((w, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formula Versions & Normative References */}
        <div className="pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-600" />
                Versões das Fórmulas
              </h4>
              <div className="space-y-1 text-sm">
                {Object.entries(analysis.formulaVersions || {}).map(([key, version]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    <span className="font-mono font-medium text-slate-800">{version}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Referências Normativas
              </h4>
              <ul className="space-y-1 text-xs text-slate-600">
                {analysis.normativeReferences?.map((ref, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}