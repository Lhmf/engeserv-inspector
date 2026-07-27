"use client";

import { useState } from "react";
import { engineeringIntegration } from "@/modules/engineering/integration";
import type { EngineeringCase, FormattedIntegrityAnalysis, FormattedSimulationResult, FormattedCalculationResult, CalculationType } from "@/modules/engineering/integration/types";

// ============================================
// Types & Data
// ============================================

type CaseItem = {
  id: string;
  client: string;
  equipment: string;
  tag: string;
  status: "APROVADO" | "REJEITADO" | "EM VALIDAÇÃO" | "PLACEHOLDER";
  statusColor: string;
  lastInspection: string;
  corrosionRate: number | null;
  remainingLife: number | null;
  mawp: number | null;
};

// Casos do Engineering Studio (sincronizados com a integração)
const cases: CaseItem[] = [
  {
    id: "V-101",
    client: "Petrobras",
    equipment: "Vaso de Pressão",
    tag: "V-101",
    status: "APROVADO",
    statusColor: "bg-emerald-100 text-emerald-700",
    lastInspection: "2024-03-15",
    corrosionRate: 0.133,
    remainingLife: 37.6,
    mawp: 22.38,
  },
  {
    id: "V-401",
    client: "Braskem",
    equipment: "Vaso de Pressão",
    tag: "V-401",
    status: "REJEITADO",
    statusColor: "bg-rose-100 text-rose-700",
    lastInspection: "2024-02-20",
    corrosionRate: 0.45,
    remainingLife: 2.1,
    mawp: 4.13,
  },
  {
    id: "T-205",
    client: "Raízen",
    equipment: "Tanque de Armazenamento",
    tag: "T-205",
    status: "EM VALIDAÇÃO",
    statusColor: "bg-amber-100 text-amber-700",
    lastInspection: "2024-04-10",
    corrosionRate: 0.089,
    remainingLife: 45.2,
    mawp: null,
  },
  {
    id: "C-312",
    client: "Petrobras",
    equipment: "Caldeira",
    tag: "C-312",
    status: "PLACEHOLDER",
    statusColor: "bg-slate-100 text-slate-700",
    lastInspection: "2023-11-05",
    corrosionRate: null,
    remainingLife: null,
    mawp: null,
  },
];

// ============================================
// Helper Functions
// ============================================

function getStatusColor(status: string): string {
  switch (status) {
    case "APROVADO":
      return "#10b981";
    case "REJEITADO":
      return "#f43f5e";
    case "EM VALIDAÇÃO":
      return "#f59e0b";
    default:
      return "#94a3b8";
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-700";
    case "WARNING":
      return "bg-amber-100 text-amber-700";
    case "ERROR":
      return "bg-rose-100 text-rose-700";
    case "INSUFFICIENT_DATA":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getCriticalityColor(criticality: string): string {
  switch (criticality) {
    case "CRITICAL":
      return "bg-rose-100 text-rose-700";
    case "HIGH":
      return "bg-amber-100 text-amber-700";
    case "MEDIUM":
      return "bg-blue-100 text-blue-700";
    case "LOW":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getReliabilityColor(reliability: string): string {
  switch (reliability) {
    case "HIGH":
      return "bg-emerald-100 text-emerald-700";
    case "MEDIUM":
      return "bg-blue-100 text-blue-700";
    case "LOW":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

// ============================================
// Sub-components (defined BEFORE main component)
// ============================================

function CaseCard({ caseItem, isSelected, onClick }: { caseItem: CaseItem; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 ${
        isSelected
          ? "border-navy bg-navy-50"
          : "border-slate-200 hover:border-navy hover:bg-navy-50"
      }`}
      aria-label={`Selecionar caso ${caseItem.tag} - ${caseItem.client}`}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        {/* Status Indicator */}
        <div
          className="flex-shrink-0 w-3 h-3 rounded-full mt-1.5"
          style={{ backgroundColor: getStatusColor(caseItem.status) }}
          aria-hidden="true"
        />

        {/* Case Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 truncate">{caseItem.tag}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${caseItem.statusColor}`}>
              {caseItem.status}
            </span>
          </div>
          <p className="text-sm text-slate-600 truncate">{caseItem.client}</p>
          <p className="text-xs text-slate-500">{caseItem.equipment}</p>

          {/* Metrics */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Inspeção</p>
              <p className="font-medium text-slate-800">{formatDate(caseItem.lastInspection)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Taxa Corrosão</p>
              <p className="font-medium text-slate-800">
                {caseItem.corrosionRate !== null ? `${caseItem.corrosionRate} mm/ano` : "—"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <p className="text-slate-400">Vida Útil</p>
              <p className="font-medium text-slate-800">
                {caseItem.remainingLife !== null ? `${caseItem.remainingLife} anos` : "—"}
              </p>
            </div>
          </div>

          {caseItem.mawp !== null && (
            <div className="mt-2 text-xs text-slate-500">
              PMTA: <span className="font-medium text-slate-800">{caseItem.mawp} bar</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function KpiCard({
  label,
  value,
  valueColor = "text-slate-800",
}: {
  label: string;
  value: number | string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 border-b border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <span className="text-navy">{icon}</span>
        {title}
      </h2>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

function PlaceholderPanel({ message }: { message: string }) {
  return (
    <div className="p-4 text-center text-slate-500 py-8">
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ResultCard({ result }: { result: FormattedCalculationResult }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-800">{result.label}</h4>
          <p className="text-sm text-slate-600 mt-1">{result.explanation}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(result.status)}`}>
            {result.status}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCriticalityColor(result.criticality)}`}>
            {result.criticality}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
        <div>
          <p className="text-slate-400">Valor</p>
          <p className="font-mono font-medium text-slate-800 text-lg">{result.value} {result.unit}</p>
        </div>
        <div>
          <p className="text-slate-400">Confiabilidade</p>
          <p className="font-medium text-slate-800">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getReliabilityColor(result.reliability)}`}>
              {result.reliability}
            </span>
          </p>
        </div>
        <div>
          <p className="text-slate-400">Norma</p>
          <p className="font-medium text-slate-800 truncate max-w-[120px]">{result.normativeReference}</p>
        </div>
      </div>

      {result.observations.length > 0 && (
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs text-slate-500 mb-1">Observações:</p>
          <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
            {result.observations.map((obs, i) => (
              <li key={i}>{obs}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IntegrityAnalysisPanel({ analysis }: { analysis: FormattedIntegrityAnalysis }) {
  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Análise de Integridade</h3>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCriticalityColor(analysis.overallCriticality)}`}>
              {analysis.overallCriticality}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {analysis.overallStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Equipamento</p>
            <p className="font-medium text-slate-800">{analysis.equipmentId}</p>
          </div>
          <div>
            <p className="text-slate-400">Inspeção</p>
            <p className="font-medium text-slate-800">{analysis.inspectionId}</p>
          </div>
          <div>
            <p className="text-slate-400">Data</p>
            <p className="font-medium text-slate-800">{formatDate(analysis.analyzedAt.toString())}</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Recomendações
          </h4>
          <ul className="text-sm text-emerald-700 space-y-1 pl-4 list-disc">
            {analysis.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {analysis.riskFactors.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <h4 className="font-semibold text-rose-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Fatores de Risco
          </h4>
          <ul className="text-sm text-rose-700 space-y-2">
            {analysis.riskFactors.map((rf, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getCriticalityColor(rf.severity)}`}>
                  {rf.severity}
                </span>
                <div>
                  <p className="font-medium">{rf.factor}</p>
                  <p className="text-rose-600">{rf.description}</p>
                  {rf.mitigation && <p className="text-rose-500 italic">Mitigação: {rf.mitigation}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calculations */}
      <div>
        <h4 className="font-semibold text-slate-800 mb-3">Cálculos Executados</h4>
        <div className="space-y-3">
          {analysis.calculations.map((calc) => (
            <ResultCard key={calc.id} result={calc} />
          ))}
        </div>
      </div>

      {/* Formula Versions */}
      <details className="group border border-slate-200 rounded-lg">
        <summary className="p-3 bg-slate-50 cursor-pointer flex items-center justify-between">
          <span className="font-medium text-slate-700">Versões das Fórmulas e Normas</span>
          <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="p-3 text-sm text-slate-600 space-y-2">
          {Object.entries(analysis.formulaVersions).map(([key, version]) => (
            <div key={key} className="flex justify-between">
              <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="font-mono font-medium text-slate-800">{version}</span>
            </div>
          ))}
          <hr className="my-2 border-slate-200" />
          <div className="text-xs text-slate-500">
            <p>Referências Normativas:</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {analysis.normativeReferences.map((ref, i) => (
                <li key={i}>{ref}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

function SimulationPanel({ simulation }: { simulation: FormattedSimulationResult }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-3">Simulação: {simulation.scenario}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-blue-600">Espessura Projetada</p>
            <p className="font-mono font-bold text-slate-800">{simulation.projectedThicknessMm.toFixed(2)} mm</p>
          </div>
          <div>
            <p className="text-blue-600">Vida Útil Remanescente</p>
            <p className="font-mono font-bold text-slate-800">{simulation.remainingLifeYears.toFixed(1)} anos</p>
          </div>
          <div>
            <p className="text-blue-600">Data Projetada</p>
            <p className="font-medium text-slate-800">{formatDate(simulation.projectedDate.toString())}</p>
          </div>
          <div>
            <p className="text-blue-600">Intervalo Inspeção</p>
            <p className="font-mono font-bold text-slate-800">{simulation.recommendedInspectionIntervalMonths} meses</p>
          </div>
        </div>

        {simulation.willReachMinThickness && simulation.estimatedDateMinThickness && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
            <p className="text-rose-800 font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Atingirá espessura mínima em {formatDate(simulation.estimatedDateMinThickness.toString())}
            </p>
          </div>
        )}
      </div>

      {simulation.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-800 mb-2">Avisos</h4>
          <ul className="text-sm text-amber-700 space-y-1 pl-4 list-disc">
            {simulation.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function CalculationResultPanel({ result }: { result: FormattedCalculationResult }) {
  return (
    <div className="space-y-4">
      <ResultCard result={result} />
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function EngineeringPage() {
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [calculationType, setCalculationType] = useState<CalculationType>("FULL_INTEGRITY");
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastResult, setLastResult] = useState<
    | FormattedIntegrityAnalysis
    | FormattedSimulationResult
    | FormattedCalculationResult
    | null
  >(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const handleCalculate = async (type: CalculationType) => {
    setIsCalculating(true);
    setLastError(null);

    try {
      const result = await engineeringIntegration.runCalculation({
        caseId: selectedCase!.id,
        calculationType: type,
      });

      if (result.success && result.data) {
        setLastResult(result.data);
        setHistory(engineeringIntegration.getCalculationHistory(selectedCase!.id));
      } else {
        setLastError(result.error || "Erro desconhecido");
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSimulation = async () => {
    setIsCalculating(true);
    setLastError(null);

    try {
      const result = await engineeringIntegration.runSimulation({
        caseId: selectedCase!.id,
        calculationType: "SIMULATION",
      });

      if (result.success && result.data) {
        setLastResult(result.data);
        setHistory(engineeringIntegration.getCalculationHistory(selectedCase!.id));
      } else {
        setLastError(result.error || "Erro na simulação");
      }
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <nav className="flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
                <a href="/dashboard" className="hover:text-slate-700 transition-colors">Dashboard</a>
                <span className="text-slate-300">/</span>
                <span className="text-slate-700 font-medium" aria-current="page">Engineering Studio</span>
              </nav>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Engineering Studio</h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Ambiente interno de validação de fórmulas para o Engineering Engine
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                Internal Tool
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                v0.1.0-alpha
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs Row */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Casos Totais" value={cases.length} valueColor="text-slate-800" />
          <KpiCard
            label="Aprovados"
            value={cases.filter((c) => c.status === "APROVADO").length}
            valueColor="text-emerald-600"
          />
          <KpiCard
            label="Em Validação"
            value={cases.filter((c) => c.status === "EM VALIDAÇÃO").length}
            valueColor="text-amber-600"
          />
          <KpiCard
            label="Rejeitados"
            value={cases.filter((c) => c.status === "REJEITADO").length}
            valueColor="text-rose-600"
          />
        </div>

        {/* Main Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Cases List */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Casos Reais
                </h2>
                <p className="text-sm text-slate-500 mt-1">Selecione um caso para validar</p>
              </div>
              <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {cases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    isSelected={selectedCase?.id === caseItem.id}
                    onClick={() => setSelectedCase(caseItem)}
                  />
                ))}
              </div>
            </div>
          </aside>

          {/* Right Column: Execution Area */}
          <section className="lg:col-span-2 space-y-6">
            {/* Parameters Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <SectionHeader
                title="Parâmetros de Cálculo"
                description="Configure os parâmetros para execução"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
              <div className="p-4">
                {selectedCase ? (
                  <div className="space-y-4">
                    {/* Selected Case Confirmation */}
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-emerald-800 text-sm font-medium">
                        Caso selecionado: <strong>{selectedCase.tag}</strong> - {selectedCase.client}
                      </span>
                    </div>

                    {/* Calculation Type Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">Tipo de Cálculo</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { type: "FULL_INTEGRITY" as CalculationType, label: "Análise Completa", desc: "Todos os cálculos + status" },
                          { type: "MINIMUM_THICKNESS" as CalculationType, label: "Espessura Mínima", desc: "t_min (ASME VIII-1)" },
                          { type: "CORROSION_RATE" as CalculationType, label: "Taxa Corrosão", desc: "CR (API 570/510)" },
                          { type: "REMAINING_LIFE" as CalculationType, label: "Vida Útil", desc: "Anos restantes" },
                          { type: "MAWP" as CalculationType, label: "PMTA", desc: "Pressão máx. admissível" },
                          { type: "SIMULATION" as CalculationType, label: "Simulação", desc: "Projeção futura" },
                        ].map(({ type, label, desc }) => (
                          <button
                            key={type}
                            onClick={() => setCalculationType(type)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              calculationType === type
                                ? "border-navy bg-navy-50"
                                : "border-slate-200 hover:border-navy hover:bg-navy-50"
                            }`}
                          >
                            <p className="font-medium text-slate-800">{label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Execute Button */}
                    <button
                      onClick={() => handleCalculate(calculationType)}
                      disabled={isCalculating || !selectedCase}
                      className="w-full py-3 px-4 bg-navy text-white rounded-lg font-medium hover:bg-navy/90 focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCalculating ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Calculando...
                        </span>
                      ) : (
                        `Executar ${calculationType.replace(/_/g, " ")}`
                      )}
                    </button>

                    {/* Simulation Button (separate) */}
                    {calculationType === "SIMULATION" && (
                      <button
                        onClick={handleSimulation}
                        disabled={isCalculating || !selectedCase}
                        className="w-full py-3 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isCalculating ? "Simulando..." : "Executar Simulação"}
                      </button>
                    )}
                  </div>
                ) : (
                  <PlaceholderPanel message="Selecione um caso à esquerda para configurar parâmetros" />
                )}
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <SectionHeader
                title="Resultados da Execução"
                description="Visualize resultados e histórico de validações"
                icon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                }
              />
              <div className="p-4">
                {selectedCase ? (
                  <>
                    {lastError && (
                      <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
                        <strong>Erro: </strong>{lastError}
                      </div>
                    )}

                    {lastResult ? (
                      <>
                        {/* Integrity Analysis */}
                        {("overallStatus" in lastResult) && (
                          <IntegrityAnalysisPanel analysis={lastResult as FormattedIntegrityAnalysis} />
                        )}

                        {/* Simulation Result */}
                        {("scenario" in lastResult) && (
                          <SimulationPanel simulation={lastResult as FormattedSimulationResult} />
                        )}

                        {/* Single Calculation Result */}
                        {("label" in lastResult) && !("overallStatus" in lastResult) && !("scenario" in lastResult) && (
                          <CalculationResultPanel result={lastResult as FormattedCalculationResult} />
                        )}
                      </>
                    ) : (
                      <PlaceholderPanel message="Clique em 'Executar' para calcular. Os resultados aparecerão aqui com estrutura completa do Engineering Engine." />
                    )}

                    {/* History */}
                    {history.length > 0 && (
                      <details className="mt-6 group border border-slate-200 rounded-lg">
                        <summary className="p-3 bg-slate-50 cursor-pointer flex items-center justify-between">
                          <span className="font-medium text-slate-700">Histórico de Execuções ({history.length})</span>
                          <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                          {history.map((entry: any) => (
                            <div key={entry.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-800">{entry.calculationType}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                  entry.status === "SUCCESS" ? "bg-emerald-100 text-emerald-700" :
                                  entry.status === "WARNING" ? "bg-amber-100 text-amber-700" :
                                  "bg-rose-100 text-rose-700"
                                }`}>
                                  {entry.status}
                                </span>
                              </div>
                              <p className="text-slate-600 mt-0.5">{entry.resultSummary}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {new Date(entry.executedAt).toLocaleString("pt-BR")} | v{entry.formulaVersion}
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <PlaceholderPanel message="Selecione um caso à esquerda para visualizar resultados" />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}