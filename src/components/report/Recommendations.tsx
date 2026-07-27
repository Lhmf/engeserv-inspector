"use client";

import { Recommendation, RecommendationsSection } from "@/modules/report/types";
import { AlertTriangle, Clock, Wrench, Eye, TrendingUp, Lightbulb, CheckCircle2, FileText, Calendar, User, Settings } from "lucide-react";

interface RecommendationsProps {
  recommendations: RecommendationsSection;
  nextInspection?: {
    recommendedDate: Date;
    maxIntervalMonths: number;
    type: string;
    justification: string;
    scope: string[];
    acceptanceCriteria: string;
  };
}

export function Recommendations({ recommendations, nextInspection }: RecommendationsProps) {
  const priorityLabels = {
    CRITICAL: "Crítica",
    HIGH: "Alta",
    MEDIUM: "Média",
    LOW: "Baixa",
  };

  const categoryLabels = {
    REPAIR: "Reparo",
    REPLACE: "Substituição",
    MONITOR: "Monitoramento",
    INSPECT: "Inspeção",
    DOCUMENT: "Documentação",
    OPERATIONAL: "Operacional",
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "REPAIR": return <Wrench className="w-5 h-5 text-blue-600" />;
      case "REPLACE": return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case "MONITOR": return <Eye className="w-5 h-5 text-emerald-600" />;
      case "INSPECT": return <Clock className="w-5 h-5 text-amber-600" />;
      case "DOCUMENT": return <FileText className="w-5 h-5 text-blue-600" />;
      case "OPERATIONAL": return <Settings className="w-5 h-5 text-purple-600" />;
      default: return <Lightbulb className="w-5 h-5 text-amber-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      CRITICAL: "bg-rose-100 text-rose-700",
      HIGH: "bg-orange-100 text-orange-700",
      MEDIUM: "bg-amber-100 text-amber-700",
      LOW: "bg-emerald-100 text-emerald-700",
    };
    return configs[priority as keyof typeof configs] || "bg-slate-100 text-slate-700";
  };

  const renderRecommendationList = (title: string, items: Recommendation[], icon: React.ReactNode, emptyMessage: string) => {
    if (!items.length) {
      return (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm">{emptyMessage}</span>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          {items.length > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">{items.length}</span>}
          {title}
        </h4>
        <ul className="space-y-2">
          {items.map((rec, index) => (
            <li key={index} className="p-4 bg-white rounded-lg border border-slate-200 hover:border-navy/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 bg-slate-100 rounded-lg">
                  {getCategoryIcon(rec.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(rec.priority)}`}>
                      {priorityLabels[rec.priority as keyof typeof priorityLabels] || rec.priority}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {categoryLabels[rec.category as keyof typeof categoryLabels] || rec.category}
                    </span>
                    {rec.referencedStandard && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <FileText className="w-3 h-3 mr-1" />
                        {rec.referencedStandard}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 text-sm">{rec.description}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    {rec.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Prazo: {new Date(rec.dueDate).toLocaleDateString("pt-BR")}</span>
                      </span>
                    )}
                    {rec.responsibleRole && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>Responsável: {rec.responsibleRole}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Recomendações</h2>
            <p className="text-sm text-slate-500">Ações recomendadas baseadas na análise de engenharia</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {renderRecommendationList(
          "Imediatas (Críticas)",
          recommendations.immediate,
          <AlertTriangle className="w-5 h-5 text-rose-600" />,
          "Nenhuma ação imediata necessária"
        )}

        {renderRecommendationList(
          "Curto Prazo (até 6 meses)",
          recommendations.shortTerm,
          <Clock className="w-5 h-5 text-amber-600" />,
          "Nenhuma recomendação de curto prazo"
        )}

        {renderRecommendationList(
          "Médio Prazo (6-18 meses)",
          recommendations.mediumTerm,
          <TrendingUp className="w-5 h-5 text-blue-600" />,
          "Nenhuma recomendação de médio prazo"
        )}

        {renderRecommendationList(
          "Longo Prazo (18+ meses)",
          recommendations.longTerm,
          <TrendingUp className="w-5 h-5 text-purple-600" />,
          "Nenhuma recomendação de longo prazo"
        )}

        {/* Inspection Recommendation */}
        {nextInspection && (
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Próxima Inspeção Recomendada
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Data Recomendada</p>
                  <p className="font-semibold text-slate-800">
                    {nextInspection.recommendedDate
                      ? new Date(nextInspection.recommendedDate).toLocaleDateString("pt-BR")
                      : "Não definida"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Intervalo</p>
                  <p className="font-semibold text-slate-800">
                    {nextInspection.maxIntervalMonths} meses
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tipo</p>
                  <p className="font-semibold text-slate-800 capitalize">
                    {nextInspection.type.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Critério</p>
                  <p className="font-semibold text-slate-800">{nextInspection.acceptanceCriteria}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Escopo da Próxima Inspeção</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {nextInspection.scope?.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}