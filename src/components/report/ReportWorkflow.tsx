"use client";

import { TechnicalReport } from "@/modules/report/types";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText,
  Send,
  CheckCheck,
  X,
  Share2,
  Shield,
  UserCheck,
  UserX,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  ArrowRight,
  User
} from "lucide-react";

interface ReportWorkflowProps {
  report: TechnicalReport;
  activePanel: "workflow" | "checklist" | "history";
  onPanelChange: (panel: "workflow" | "checklist" | "history") => void;
  onAction: (action: string) => void;
}

export function ReportWorkflow({ report, activePanel, onPanelChange, onAction }: ReportWorkflowProps) {
  const statusColors = {
    DRAFT: "bg-slate-100 text-slate-700",
    UNDER_REVIEW: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-rose-100 text-rose-700",
    PUBLISHED: "bg-blue-100 text-blue-700",
    ARCHIVED: "bg-slate-100 text-slate-700",
  };

  const statusLabels = {
    DRAFT: "Rascunho",
    UNDER_REVIEW: "Em Revisão",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    PUBLISHED: "Publicado",
    ARCHIVED: "Arquivado",
  };

  const workflowSteps = [
    { id: "draft", label: "Rascunho", icon: <FileText className="w-4 h-4" />, status: "DRAFT" },
    { id: "review", label: "Em Revisão", icon: <Clock className="w-4 h-4" />, status: "UNDER_REVIEW" },
    { id: "validation", icon: <ShieldCheck className="w-4 h-4" />, label: "Validação Engenharia", status: "VALIDATION" },
    { id: "approval", icon: <CheckCircle2 className="w-4 h-4" />, label: "Aprovação Gestor", status: "APPROVAL" },
    { id: "published", icon: <Share2 className="w-4 h-4" />, label: "Publicado", status: "PUBLISHED" },
  ];

  const getStepStatus = (stepStatus: string) => {
    const currentStatus = report.identification.status;
    const statusOrder = ["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED"];
    const currentIndex = statusOrder.indexOf(report.identification.status);
    const stepIndex = statusOrder.indexOf(stepStatus);
    
    if (stepStatus === "VALIDATION") return currentIndex >= 1 ? "completed" : currentIndex === 1 ? "current" : "pending";
    if (stepStatus === "APPROVAL") return currentIndex >= 2 ? "completed" : currentIndex === 2 ? "current" : "pending";
    if (stepStatus === "PUBLISHED") return currentIndex >= 3 ? "completed" : currentIndex === 3 ? "current" : "pending";
    if (stepIndex <= currentIndex) return "completed";
    if (stepIndex === currentIndex + 1) return "current";
    return "pending";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Panel Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex" aria-label="Painéis laterais">
          {["workflow", "checklist", "history"].map((panel) => (
            <button
              key={panel}
              onClick={() => onPanelChange(panel as "workflow" | "checklist" | "history")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activePanel === panel
                  ? "border-navy text-navy"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {panel === "workflow" && "Workflow"}
              {panel === "checklist" && "Checklist"}
              {panel === "history" && "Histórico"}
            </button>
          ))}
        </nav>
      </div>

      {/* Panel Content */}
      <div className="p-4">
        {activePanel === "workflow" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Progresso do Laudo</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${{
                DRAFT: "bg-slate-100 text-slate-700",
                UNDER_REVIEW: "bg-amber-100 text-amber-700",
                APPROVED: "bg-emerald-100 text-emerald-700",
                REJECTED: "bg-rose-100 text-rose-700",
                PUBLISHED: "bg-blue-100 text-blue-700",
                ARCHIVED: "bg-slate-100 text-slate-700",
              }[report.identification.status] || "bg-slate-100 text-slate-700"}`}>
                {{
                  DRAFT: "Rascunho",
                  UNDER_REVIEW: "Em Revisão",
                  APPROVED: "Aprovado",
                  REJECTED: "Rejeitado",
                  PUBLISHED: "Publicado",
                  ARCHIVED: "Arquivado",
                }[report.identification.status] || report.identification.status}
              </span>
            </div>

            {/* Workflow Steps */}
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" style={{ height: "calc(100% + 40px)" }} />
              
              {workflowSteps.map((step, index) => {
                const stepStatus = getStepStatus(step.status);
                const isLast = index === workflowSteps.length - 1;
                
                return (
                  <div key={step.id} className="relative flex items-start gap-4 mb-6 last:mb-0">
                    {/* Step Circle */}
                    <div className="relative flex-shrink-0">
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                        stepStatus === "completed" 
                          ? "bg-emerald-500 border-emerald-500 text-white" 
                          : stepStatus === "current" 
                            ? "bg-navy border-navy text-white" 
                            : "bg-white border-slate-300 text-slate-400"
                      }`}>
                        {stepStatus === "completed" ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : stepStatus === "current" ? (
                          <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      {/* Connector line below */}
                      {!isLast && (
                        <div className={`absolute left-5 top-10 bottom-0 w-0.5 ${index < workflowSteps.length - 1 ? "bg-slate-200" : "hidden"}`} />
                      )}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className={`p-3 rounded-lg border transition-colors ${
                        stepStatus === "current" ? "bg-navy-50 border-navy-200" : 
                        stepStatus === "completed" ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${stepStatus === "completed" ? "bg-emerald-100" : stepStatus === "current" ? "bg-navy-100" : "bg-slate-100"}`}>
                            {workflowSteps[index].icon}
                          </div>
                          <div>
                            <p className={`font-medium text-slate-800 ${workflowSteps[index].status === "PUBLISHED" ? "text-blue-600" : ""}`}>
                              {workflowSteps[index].label}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {stepStatus === "completed" ? "Concluído" : stepStatus === "current" ? "Em andamento" : "Pendente"}
                            </p>
                          </div>
                        </div>
                        
                        {stepStatus === "current" && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => onAction(`complete-${workflowSteps[index].id}`)}
                                className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-95"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Concluir
                              </button>
                              <button
                                onClick={() => onAction(`skip-${workflowSteps[index].id}`)}
                                className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 active:scale-95"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Pular
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activePanel === "checklist" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Checklist de Validação</h3>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                100% Completo
              </span>
            </div>
            
            <div className="space-y-3">
              {[
                { id: "identification", label: "Identificação completa", passed: true, required: true },
                { id: "executive-summary", label: "Resumo executivo preenchido", passed: true, required: true },
                { id: "inspection-data", label: "Dados da inspeção completos", passed: true, required: true },
                { id: "measurements", label: "Medições válidas", passed: true, required: true },
                { id: "engineering-results", label: "Resultados de engenharia", passed: true, required: true },
                { id: "conclusion", label: "Conclusão técnica definida", passed: true, required: true },
                { id: "recommendations", label: "Recomendações preenchidas", passed: true, required: true },
                { id: "next-inspection", label: "Próxima inspeção agendada", passed: true, required: true },
                { id: "photos", label: "Fotos anexadas", passed: true, required: false },
                { id: "signatures", label: "Assinaturas coletadas", passed: false, required: true },
              ].map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-lg border border-slate-200 hover:border-navy/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.passed ? "bg-emerald-100" : item.required ? "bg-rose-50" : "bg-slate-100"}`}>
                        {item.passed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : item.required ? (
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.required ? "Obrigatório" : "Opcional"}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.passed ? "bg-emerald-100 text-emerald-700" : item.required ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.passed ? "Concluído" : item.required ? "Pendente" : "Opcional"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePanel === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Histórico de Versões</h3>
              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                {report.history.totalVersions} versões
              </span>
            </div>
            
            <div className="space-y-3">
              {report.history.versions.slice().reverse().map((version, index) => (
                <div key={version.version} className="p-4 bg-white rounded-lg border border-slate-200 hover:border-navy/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        version.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                        version.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" :
                        version.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                        version.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
                        version.status === "PUBLISHED" ? "bg-blue-100 text-blue-700" :
                        version.status === "ARCHIVED" ? "bg-slate-100 text-slate-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {{
                          DRAFT: "Rascunho",
                          UNDER_REVIEW: "Em Revisão",
                          APPROVED: "Aprovado",
                          REJECTED: "Rejeitado",
                          PUBLISHED: "Publicado",
                          ARCHIVED: "Arquivado",
                        }[version.status] || version.status}
                      </span>
                      <span className="font-mono font-semibold text-slate-800">v{version.version}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(version.date).toLocaleString("pt-BR", { 
                          day: "2-digit", 
                          month: "2-digit", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {version.authorName} ({version.authorRole})
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{version.changes}</p>
                  {version.previousVersion !== undefined && (
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-mono">v{version.previousVersion}</span> → <span className="font-mono">v{version.version}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}