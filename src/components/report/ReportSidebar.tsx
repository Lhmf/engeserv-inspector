"use client";

import { 
  FileText, 
  ClipboardList, 
  Image, 
  Ruler, 
  Calculator, 
  CheckCircle2, 
  Lightbulb, 
  Paperclip, 
  Clock, 
  PenTool,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";

interface ReportSidebarProps {
  report: {
    identification: {
      reportNumber: string;
      version: number;
      status: string;
    };
    inspectionData: {
      inspection: {
        status: string;
      };
      equipment: {
        tag: string;
      };
    };
  };
  sections: { id: string; label: string; icon: React.ReactNode }[];
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export function ReportSidebar({ report, sections, activeSection, onSectionChange }: ReportSidebarProps) {
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 sticky top-24 h-fit">
      {/* Report Info Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Laudo Técnico</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${({
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
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Número</span>
            <span className="font-mono font-medium text-slate-800">{report.identification.reportNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Versão</span>
            <span className="font-medium text-slate-800">v{report.identification.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Equipamento</span>
            <span className="font-medium text-slate-800 truncate">{report.inspectionData.equipment.tag}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Inspeção</span>
            <span className="font-medium text-slate-800 capitalize">{report.inspectionData.inspection.status?.toLowerCase().replace("_", " ")}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2" aria-label="Navegação do laudo">
        <ul className="space-y-1" role="list">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => onSectionChange(section.id)}
                className={`w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 flex items-center gap-3 ${
                  activeSection === section.id
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
                role="button"
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center ${activeSection === section.id ? "text-white" : "text-slate-400"}`}>
                  {section.icon}
                </span>
                <span className={`font-medium text-sm ${activeSection === section.id ? "text-white" : "text-slate-600"}`}>
                  {section.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-slate-200">
        <div className="space-y-2">
          <button className="w-full px-3 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Exportar PDF
          </button>
          <button className="w-full px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Dados
          </button>
        </div>
      </div>
    </div>
  );
}