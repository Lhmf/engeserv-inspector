"use client";

import { ReportSignature, TechnicalReport } from "@/modules/report/types";
import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  UserPlus,
  Mail,
  Phone,
  Calendar,
  FileText,
  PenTool,
  Hash,
  AlertCircle,
  CheckCircle2,
  User,
  ShieldCheck,
  Clock as ClockIcon
} from "lucide-react";

interface SignaturePanelProps {
  signatures: TechnicalReport["signatures"];
  onSign: (action: string) => void;
}

const roleConfig = {
  INSPECTOR: { label: "Inspetor", icon: User, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", desc: "Executou a inspeção" },
  ENGINEER: { label: "Engenheiro", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", desc: "Validou cálculos" },
  MANAGER: { label: "Gestor", icon: Users, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", desc: "Aprovou o laudo" },
  QUALITY: { label: "Qualidade", icon: ShieldCheck, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", desc: "Validou qualidade" },
} as const;

export function SignaturePanel({ signatures, onSign }: SignaturePanelProps) {
  const requiredRoles = ["INSPECTOR", "ENGINEER", "MANAGER", "QUALITY"] as const;
  
  const getSignature = (role: keyof typeof roleConfig) => signatures[role.toLowerCase() as keyof typeof signatures];
  
  const isComplete = requiredRoles.every(role => {
    const sig = signatures[role.toLowerCase() as keyof typeof signatures];
    return sig && typeof sig === 'object' && 'status' in sig && sig.status === "APPROVED";
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy/10 rounded-lg">
              <PenTool className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Assinaturas</h3>
              <p className="text-sm text-slate-500">Controle de aprovações do laudo</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isComplete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}>
            {isComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Completo
              </>
            ) : (
              <>
                <ClockIcon className="w-4 h-4 animate-spin" />
                Pendente
              </>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progresso</span>
          <span className="text-sm text-slate-500">
            {requiredRoles.filter(r => {
              const sig = signatures[r.toLowerCase() as keyof typeof signatures];
              return sig && typeof sig === 'object' && 'status' in sig && sig.status === "APPROVED";
            }).length} / 4 assinaturas
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-navy to-emerald transition-all duration-300"
            style={{ width: `${(requiredRoles.filter(r => {
              const sig = signatures[r.toLowerCase() as keyof typeof signatures];
              return sig && typeof sig === 'object' && 'status' in sig && sig.status === "APPROVED";
            }).length / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Signature Cards */}
      <div className="p-4 space-y-4">
        {requiredRoles.map((role) => {
          const config = roleConfig[role];
          const signature = getSignature(role);
          const isSigned = signature && typeof signature === 'object' && 'status' in signature && signature.status === "APPROVED";
          const isRejected = signature && typeof signature === 'object' && 'status' in signature && signature.status === "REJECTED";
          const isPending = !signature || (typeof signature === 'object' && 'status' in signature && signature.status !== "APPROVED" && signature.status !== "REJECTED");

          return (
            <div 
              key={role} 
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSigned ? `${config.border} ${config.bg}` : 
                isRejected ? "border-rose-200 bg-rose-50" : 
                "border-slate-200 bg-white hover:border-navy/50"
              }`}
            >
              {/* Status Badge */}
              <div className="absolute -top-2 -right-2">
                {isSigned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Aprovado
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                    <XCircle className="w-3 h-3" />
                    Rejeitado
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full animate-pulse">
                    <ClockIcon className="w-3 h-3 animate-spin" />
                    Pendente
                  </span>
                )}
              </div>

              <div className="flex items-start gap-4">
                {/* Role Icon */}
                <div className={`flex-shrink-0 p-3 rounded-xl ${config.bg} ${config.border}`}>
                  <config.icon className={`w-6 h-6 ${config.color}`} />
                </div>

                {/* Role Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-800">{config.label}</h4>
                    {isSigned && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                        Aprovado
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                        Rejeitado
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{config.desc}</p>
                  
                  {signature && typeof signature === 'object' && 'userName' in signature && (
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{signature.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(signature.signedAt).toLocaleString("pt-BR")}</span>
                      </div>
                      {signature.userRegistration && (
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>CREA: {signature.userRegistration}</span>
                        </div>
                      )}
                      {signature.comments && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="text-slate-600">{signature.comments}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isPending && signature && typeof signature === 'object' && 'role' in signature && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSign(`sign-${signature.role.toLowerCase()}-approve`)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => onSign(`sign-${signature.role.toLowerCase()}-reject`)}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  )}
                  {isSigned && signature && typeof signature === 'object' && 'role' in signature && (
                    <button
                      onClick={() => onSign(`view-signature-${signature.role.toLowerCase()}`)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      Ver
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSign("save-draft")}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Salvar Rascunho
          </button>
          <button
            onClick={() => onSign("submit-review")}
            className="flex-1 sm:flex-none px-4 py-2 bg-navy text-white text-sm font-medium rounded-lg hover:bg-navy/90 transition-colors"
          >
            Enviar para Revisão
          </button>
          <button
            onClick={() => onSign("approve-report")}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            disabled={!isComplete}
          >
            Aprovar Laudo
          </button>
          <button
            onClick={() => onSign("reject-report")}
            className="flex-1 sm:flex-none px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={() => onSign("publish-report")}
            className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            disabled={!isComplete}
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
}