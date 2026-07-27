"use client";

import { TechnicalReport } from "@/modules/report/types";
import { Building2, Calendar, MapPin, Phone, Mail, Hash, Factory, Calendar as CalendarIcon, User, Shield, Settings } from "lucide-react";

interface ReportHeaderProps {
  report: TechnicalReport;
}

export function ReportHeader({ report }: { report: TechnicalReport }) {
  const { identification, client, equipment } = report;

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

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-navy/10 text-navy text-sm font-medium rounded-lg">
                {report.identification.type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${({
                DRAFT: "bg-slate-100 text-slate-700",
                UNDER_REVIEW: "bg-amber-100 text-amber-700",
                APPROVED: "bg-emerald-100 text-emerald-700",
                REJECTED: "bg-rose-100 text-rose-700",
                PUBLISHED: "bg-blue-100 text-blue-700",
                ARCHIVED: "bg-slate-100 text-slate-700",
              }[report.identification.status] || "bg-slate-100 text-slate-700")}`}>
                {({
                  DRAFT: "Rascunho",
                  UNDER_REVIEW: "Em Revisão",
                  APPROVED: "Aprovado",
                  REJECTED: "Rejeitado",
                  PUBLISHED: "Publicado",
                  ARCHIVED: "Arquivado",
                }[report.identification.status] || report.identification.status)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              Laudo Técnico {report.identification.reportNumber}
            </h1>
            <p className="text-slate-500 mt-1">Versão {report.identification.version}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Cliente</p>
                <p className="font-medium text-slate-800">{report.client.name}</p>
                <p className="text-xs text-slate-500">{report.client.cnpj}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Factory className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Equipamento</p>
                <p className="font-medium text-slate-800">{report.equipment.tag}</p>
                <p className="text-xs text-slate-500">{report.equipment.type.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Inspeção</p>
                <p className="font-medium text-slate-800">
                  {report.identification.inspectionDate ? new Date(report.identification.inspectionDate).toLocaleDateString("pt-BR") : "—"}
                </p>
                <p className="text-xs text-slate-500">v{report.identification.version} • {new Date(report.identification.updatedAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Hash className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">ART / Responsável</p>
                <p className="font-medium text-slate-800">{report.identification.artNumber || "—"}</p>
                <p className="text-xs text-slate-500">Inspetor: {report.identification.inspectorName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Norma e Responsável Técnico */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Norma Aplicável</p>
            <p className="font-medium text-slate-800">NR-13 / ASME BPVC VIII-1 / API 570/510</p>
            <p className="text-xs text-slate-500 mt-1">Laudo elaborado conforme normas aplicáveis</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Responsável Técnico</p>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-navy/10 rounded-lg">
                <User className="w-5 h-5 text-navy" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{report.identification.inspectorName}</p>
                {report.identification.engineerName && (
                  <p className="text-xs text-slate-500">Engenheiro: {report.identification.engineerName}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}