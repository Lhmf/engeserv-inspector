"use client";

import { TechnicalReport } from "@/modules/report/types";
import { GitBranch, Clock, User, CheckCircle2, AlertTriangle, XCircle, Calendar, FileText, PenTool, ArrowUp, ArrowDown, Archive } from "lucide-react";

interface HistoryTimelineProps {
  history: TechnicalReport["history"];
}

export function HistoryTimeline({ history }: { history: TechnicalReport["history"] }) {
  const versions = [...history.versions].sort((a, b) => b.version - a.version);

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <GitBranch className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Histórico de Versões</h2>
            <p className="text-sm text-slate-500">{history.totalVersions} versão(ões) • Atual: v{history.currentVersion}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {versions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <GitBranch className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600 mb-2">Nenhuma versão registrada</p>
            <p className="text-slate-500">O histórico de versões aparecerá aqui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div
                key={version.version}
                className={`relative p-4 rounded-xl border transition-all ${
                  version.version === 1 ? "bg-emerald-50 border-emerald-200" :
                  version.status === "PUBLISHED" ? "bg-blue-50 border-blue-200" :
                  version.status === "APPROVED" ? "bg-emerald-50 border-emerald-200" :
                  version.status === "REJECTED" ? "bg-rose-50 border-rose-200" :
                  "bg-slate-50 border-slate-200"
                }`}
              >
                {/* Version indicator line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" 
                  style={{ height: index === versions.length - 1 ? '50%' : '100%' }} />
                
                <div className="relative pl-14">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-4 w-2.5 h-2.5 rounded-full border-2 border-white flex items-center justify-center">
                    {({
                      CREATED: <GitBranch className="w-3 h-3 text-blue-600" />,
                      SUBMITTED: <Clock className="w-3 h-3 text-amber-600" />,
                      APPROVED: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
                      REJECTED: <XCircle className="w-3 h-3 text-rose-600" />,
                      PUBLISHED: <FileText className="w-3 h-3 text-blue-600" />,
                      ARCHIVED: <Archive className="w-3 h-3 text-slate-600" />,
                      VALIDATED: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
                    } as Record<string, React.ReactNode>)[version.action] || <GitBranch className="w-3 h-3 text-slate-600" />}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${({
                                              CREATED: "bg-blue-100",
                                              SUBMITTED: "bg-amber-100",
                                              APPROVED: "bg-emerald-100",
                                              REJECTED: "bg-rose-100",
                                              PUBLISHED: "bg-blue-100",
                                              ARCHIVED: "bg-slate-100",
                                              VALIDATED: "bg-emerald-100",
                                            } as Record<string, string>)[version.action] || "bg-slate-100"}`}>
                          {({
                            CREATED: <GitBranch className="w-5 h-5 text-blue-600" />,
                            SUBMITTED: <Clock className="w-5 h-5 text-amber-600" />,
                            APPROVED: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
                            REJECTED: <XCircle className="w-5 h-5 text-rose-600" />,
                            PUBLISHED: <FileText className="w-5 h-5 text-blue-600" />,
                            ARCHIVED: <Archive className="w-5 h-5 text-slate-600" />,
                            VALIDATED: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
                          } as Record<string, React.ReactNode>)[version.action] || <GitBranch className="w-5 h-5 text-slate-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {version.action === "CREATED" ? "Laudo criado" :
                               version.action === "SUBMITTED" ? "Submetido para revisão" :
                               version.action === "APPROVED" ? "Aprovado" :
                               version.action === "REJECTED" ? "Rejeitado" :
                               version.action === "PUBLISHED" ? "Publicado" :
                               version.action === "ARCHIVED" ? "Arquivado" :
                               version.action === "VALIDATED" ? "Validado" :
                               version.action}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              version.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                              version.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" :
                              version.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                              version.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
                              version.status === "PUBLISHED" ? "bg-blue-100 text-blue-700" :
                              version.status === "ARCHIVED" ? "bg-slate-100 text-slate-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {version.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{version.changes}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {version.authorName} ({version.authorRole})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(version.date).toLocaleString("pt-BR", { 
                            day: "2-digit", 
                            month: "2-digit", 
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        {version.previousVersion !== undefined && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4" />
                            v{version.previousVersion} → v{version.version}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Versão</p>
                          <p className="font-medium text-slate-800">v{version.version}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Status</p>
                          <p className="font-medium text-slate-800">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              version.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                              version.status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700" :
                              version.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                              version.status === "REJECTED" ? "bg-rose-100 text-rose-700" :
                              version.status === "PUBLISHED" ? "bg-blue-100 text-blue-700" :
                              version.status === "ARCHIVED" ? "bg-slate-100 text-slate-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {version.status}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Data</p>
                          <p className="font-medium text-slate-800">{new Date(version.date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}