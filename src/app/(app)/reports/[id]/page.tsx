"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { TechnicalReport } from "@/modules/report/types";
import { ReportSidebar } from "@/components/report/ReportSidebar";
import { ReportWorkflow } from "@/components/report/ReportWorkflow";

// Seções do laudo: lazy-load sob demanda (RC4 — performance). Cada seção
// só é carregada quando a aba correspondente é ativa.
const ExecutiveSummary = dynamic(
  () => import("@/components/report/ExecutiveSummary").then((m) => m.ExecutiveSummary),
  { loading: () => <SectionSkeleton /> }
);
const ReportPreview = dynamic(
  () => import("@/components/report/ReportPreview").then((m) => m.ReportPreview),
  { loading: () => <SectionSkeleton /> }
);
const InspectionDataCard = dynamic(
  () => import("@/components/report/InspectionDataCard").then((m) => m.InspectionDataCard),
  { loading: () => <SectionSkeleton /> }
);
const MeasurementTable = dynamic(
  () => import("@/components/report/MeasurementTable").then((m) => m.MeasurementTable),
  { loading: () => <SectionSkeleton /> }
);
const EngineeringAnalysisCard = dynamic(
  () => import("@/components/report/EngineeringAnalysisCard").then((m) => m.EngineeringAnalysisCard),
  { loading: () => <SectionSkeleton /> }
);
const TechnicalConclusion = dynamic(
  () => import("@/components/report/TechnicalConclusion").then((m) => m.TechnicalConclusion),
  { loading: () => <SectionSkeleton /> }
);
const Recommendations = dynamic(
  () => import("@/components/report/Recommendations").then((m) => m.Recommendations),
  { loading: () => <SectionSkeleton /> }
);
const Attachments = dynamic(
  () => import("@/components/report/Attachments").then((m) => m.Attachments),
  { loading: () => <SectionSkeleton /> }
);
const HistoryTimeline = dynamic(
  () => import("@/components/report/HistoryTimeline").then((m) => m.HistoryTimeline),
  { loading: () => <SectionSkeleton /> }
);
const SignaturePanel = dynamic(
  () => import("@/components/report/SignaturePanel").then((m) => m.SignaturePanel),
  { loading: () => <SectionSkeleton /> }
);
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
  Loader2,
  AlertCircle,
  ArrowLeft,
  Download,
  Printer,
  FileOutput,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  MapPin,
  Package,
  Wrench,
  Gauge,
  Thermometer,
  Droplets,
  Weight,
  Shield,
  Hash,
  User,
  Calendar,
  Building2,
  Factory,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";

const SECTIONS = [
  { id: "resumo", label: "Resumo", icon: FileText },
  { id: "preview", label: "Preview", icon: FileOutput },
  { id: "inspecao", label: "Inspeção", icon: ClipboardList },
  { id: "fotos", label: "Fotos", icon: Image },
  { id: "medicoes", label: "Medições", icon: Ruler },
  { id: "engenharia", label: "Engenharia", icon: Calculator },
  { id: "conclusao", label: "Conclusão", icon: CheckCircle2 },
  { id: "recomendacoes", label: "Recomendações", icon: Lightbulb },
  { id: "anexos", label: "Anexos", icon: Paperclip },
  { id: "historico", label: "Histórico", icon: Clock },
  { id: "assinaturas", label: "Assinaturas", icon: PenTool },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  UNDER_REVIEW: "Em Revisão",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const urlReportId = params.id as string;

  const [report, setReport] = useState<TechnicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("resumo");
  const [sidebarPanel, setSidebarPanel] = useState<"workflow" | "checklist" | "history">("workflow");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [technicalReportId, setTechnicalReportId] = useState<string>("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [workflowAction, setWorkflowAction] = useState<{ loading: boolean; stepId: string | null }>({ loading: false, stepId: null });
  const [manualSignatureMode, setManualSignatureMode] = useState(false);

  useEffect(() => {
    loadReport();
  }, [urlReportId]);

  async function loadReport() {
      setLoading(true);
      setError(null);

      try {
        // First, try to load as technicalReportId directly
        const res = await fetch(`/api/reports/pipeline?id=${urlReportId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
                  const data = await res.json();
                  if (data.report) {
                    setReport(parseDates(data.report));
                    // Priorizar technicalReportId (ID real do banco) sobre reportId (ID do factory)
                    setTechnicalReportId(data.technicalReportId || data.reportId || urlReportId);
                    setLoading(false);
                    return;
                  }
                }

        // If not found as technicalReportId, it might be an inspectionId
        // Try to run the pipeline with this ID as inspectionId
        const pipelineRes = await fetch("/api/reports/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inspectionId: urlReportId,
            equipmentId: "",
            options: {},
          }),
        });

        if (pipelineRes.ok) {
          const data = await pipelineRes.json();
          // Use technicalReportId from pipeline response if available
          const technicalReportId = data.technicalReportId || data.reportId || data.report?.id;
          if (technicalReportId) {
            setTechnicalReportId(technicalReportId);
            // Now load the actual technical report
            const techRes = await fetch(`/api/reports/pipeline?id=${technicalReportId}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            if (techRes.ok) {
              const techData = await techRes.json();
              if (techData.report) {
                setReport(parseDates(techData.report));
                setLoading(false);
                return;
              }
            }
          }
        } else {
          // Pipeline falhou — extrair mensagem de erro detalhada
          const errData = await pipelineRes.json().catch(() => ({ error: "Erro desconhecido" }));
          const errorMsg = errData.error || errData.details?.join?.('; ') || `Erro HTTP ${pipelineRes.status}`;
          throw new Error(errorMsg);
        }

        throw new Error("Laudo não encontrado");
      } catch (e: any) {
        setError(e.message || "Erro ao carregar laudo");
      } finally {
        setLoading(false);
      }
        }

        async function handleExportPdf() {
          if (!technicalReportId || isExportingPdf) return;
    
          setIsExportingPdf(true);
          try {
            const response = await fetch(`/api/reports/${technicalReportId}/pdf`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
              throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            // Verificar Content-Type
            const contentType = response.headers.get("Content-Type");
            if (!contentType?.includes("application/pdf")) {
              throw new Error("Resposta não é um PDF válido");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
      
            // Criar link de download
            const link = document.createElement("a");
            link.href = url;
            const reportNumber = report?.identification?.reportNumber || technicalReportId;
            link.download = `Laudo_NR13_${reportNumber.replace(/\//g, "-")}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
      
          } catch (err: any) {
            console.error("Erro ao exportar PDF:", err);
            alert(`Erro ao exportar PDF: ${err.message}`);
          } finally {
            setIsExportingPdf(false);
          }
        }

        async function handleDownloadData() {
          if (!report || isDownloadingData) return;
    
          setIsDownloadingData(true);
          try {
            // Criar objeto com todos os dados do laudo
            const dataExport = {
              exportDate: new Date().toISOString(),
              technicalReport: {
                identification: report.identification,
                client: report.client,
                equipment: report.equipment,
                executiveSummary: report.executiveSummary,
                inspectionData: report.inspectionData,
                engineeringResults: report.engineeringResults,
                technicalConclusion: report.technicalConclusion,
                recommendations: report.recommendations,
                nextInspection: report.nextInspection,
                attachments: report.attachments,
                history: report.history,
                validations: report.validations,
                signatures: report.signatures,
                metadata: report.metadata,
              }
            };

            const blob = new Blob([JSON.stringify(dataExport, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
      
            const link = document.createElement("a");
            link.href = url;
            const reportNumber = report.identification?.reportNumber || "laudo";
            link.download = `dados-laudo-${reportNumber.replace(/\//g, "-")}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
      
          } catch (err: any) {
            console.error("Erro ao baixar dados:", err);
            alert(`Erro ao baixar dados: ${err.message}`);
          } finally {
            setIsDownloadingData(false);
          }
        }

        async function handleWorkflowAction(action: string) {
          // action format: "complete-stepId" or "skip-stepId"
          const [type, stepId] = action.split("-");
          if (!technicalReportId || !stepId || workflowAction.loading) return;
    
          setWorkflowAction({ loading: true, stepId });
    
          try {
            // Prevent redundant transitions (e.g., already UNDER_REVIEW → UNDER_REVIEW)
            const currentStatus = report?.identification?.status;
            const targetStatusMap: Record<string, string | null> = {
              "draft": "UNDER_REVIEW",
              "review": null,
              "validation": "APPROVED",
              "approval": "PUBLISHED",
              "published": null,
            };
            const targetStatus = targetStatusMap[stepId];
            if (targetStatus && targetStatus === currentStatus) {
              alert(`O laudo já está no status "${statusLabel[currentStatus] || currentStatus}".`);
              setWorkflowAction({ loading: false, stepId: null });
              return;
            }

            // Mapear workflow step para status do TechnicalReport
            // A máquina de estados real é: DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED
            // A UI tem 5 passos visuais, mas o backend só tem 4 status reais.
            // O passo "review" (Em Revisão) não muda status — é tracking interno.
            const stepStatusMap: Record<string, string | null> = {
              "draft": "UNDER_REVIEW",
              "review": null,       // Sem transição de status — só registra no histórico
              "validation": "APPROVED",
              "approval": "PUBLISHED",
              "published": null,    // Já publicado — sem transição
            };
      
            const newStatus = stepStatusMap[stepId];
            if (newStatus === undefined) {
              throw new Error(`Etapa desconhecida: ${stepId}`);
            }
      
            // Se newStatus é null, só registrar no histórico (sem mudar status)
            if (newStatus === null) {
              const currentStatus = report?.identification?.status || "DRAFT";
              const response = await fetch(`/api/reports/${technicalReportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  status: currentStatus,
                  action: type === "complete" ? "complete" : "skip",
                  stepId,
                }),
              });
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
              }
              await loadReport();
              return;
            }

            // Chamar API para atualizar status do TechnicalReport
            const response = await fetch(`/api/reports/${technicalReportId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                status: newStatus,
                action: type === "complete" ? "complete" : "skip",
                stepId,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
              throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();
      
            // Atualizar estado local
            if (data.report) {
              setReport(parseDates(data.report));
            } else if (data.technicalReport) {
              setReport(parseDates(data.technicalReport));
            }
      
            // Recarregar para garantir sincronização
            await loadReport();
      
          } catch (err: any) {
            console.error("Erro na ação de workflow:", err);
            alert(`Erro ao ${type === "complete" ? "concluir" : "pular"} etapa: ${err.message}`);
          } finally {
            setWorkflowAction({ loading: false, stepId: null });
          }
        }

        // ============================================================
        // SIGNATURE ACTIONS (Bug 3)
        // ============================================================
        async function handleSignAction(action: string) {
          if (!technicalReportId || !report) return;

          try {
            // Parse action: "sign-{role}-approve", "sign-{role}-reject", "save-draft", etc.
            const parts = action.split("-");

            if (parts[0] === "sign" && parts.length >= 3) {
              // Signature action: sign-inspector-approve, sign-engineer-reject, etc.
              const role = parts[1]; // inspector, engineer, manager, quality
              const decision = parts[2]; // approve, reject

              const roleKey = role as keyof typeof report.signatures;
              const currentSig = report.signatures[roleKey];

              // Build updated signature
              const newSignature = {
                id: `sig-${role}-${Date.now()}`,
                role: role.toUpperCase() as any,
                userId: "",
                userName: role === "inspector" ? report.identification.inspectorName : 
                         role === "engineer" ? report.identification.engineerName || "Engenheiro" :
                         role === "manager" ? report.identification.managerName || "Gestor" :
                         "Qualidade",
                userRegistration: "",
                signedAt: new Date(),
                status: decision === "approve" ? "APPROVED" : "REJECTED",
                comments: decision === "reject" ? "Rejeitado via interface" : undefined,
              };

              const updatedSignatures = { ...report.signatures, [roleKey]: newSignature };

              const response = await fetch(`/api/reports/${technicalReportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: report.identification.status,
                  action: `sign-${role}`,
                  stepId: `sign-${role}`,
                  signatures: updatedSignatures,
                }),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
              }

              await loadReport();
              return;
            }

            // Workflow actions from signature panel
            switch (action) {
              case "save-draft":
                // Just save without changing status
                await fetch(`/api/reports/${technicalReportId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    status: report.identification.status,
                    action: "save-draft",
                    stepId: "save-draft",
                  }),
                });
                await loadReport();
                break;

              case "submit-review":
                if (report.identification.status !== "DRAFT") {
                  alert(`O laudo já está em "${statusLabel[report.identification.status] || report.identification.status}".`);
                  return;
                }
                await handleWorkflowAction("complete-draft");
                break;

              case "approve-report":
                await handleWorkflowAction("complete-validation");
                break;

              case "reject-report": {
                const reason = prompt("Informe o motivo da rejeição:");
                if (reason !== null) {
                  await fetch(`/api/reports/${technicalReportId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      status: "REJECTED",
                      action: "reject",
                      stepId: "reject",
                      rejectionReason: reason,
                    }),
                  });
                  await loadReport();
                }
                break;
              }

              case "publish-report":
                await handleWorkflowAction("complete-approval");
                break;

              default:
                console.warn(`Ação desconhecida: ${action}`);
            }
          } catch (err: any) {
            console.error("Erro na ação de assinatura:", err);
            alert(`Erro: ${err.message}`);
          }
        }

        if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-navy animate-spin" />
          <p className="text-slate-600">Carregando laudo técnico...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Laudo não encontrado</h1>
          <p className="text-slate-500 mb-6">{error || "O laudo solicitado não existe ou foi removido."}</p>
          <Link
            href="/laudos"
            className="inline-block px-6 py-3 bg-navy text-white rounded-lg font-medium hover:bg-navy/90 transition-colors"
          >
            Voltar para Laudos
          </Link>
        </div>
      </div>
    );
  }

  const sidebarSections = SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    icon: <s.icon className="w-5 h-5" />,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          aria-hidden={!sidebarOpen}
          className={`fixed lg:sticky top-0 h-screen w-80 bg-white border-r border-slate-200 dark:bg-[#141e34] dark:border-slate-800 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:visible ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full invisible"
          }`}
        >
          <ReportSidebar
                      report={report as any}
                      sections={sidebarSections}
                      activeSection={activeSection}
                      onSectionChange={(id: string) => setActiveSection(id as SectionId)}
                      technicalReportId={technicalReportId}
                      onExportPdf={handleExportPdf}
                      onDownloadData={handleDownloadData}
                      isExportingPdf={isExportingPdf}
                      isDownloadingData={isDownloadingData}
                    />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-slate-200 dark:bg-[#141e34] dark:border-slate-800">
            <div className="flex items-center justify-between p-4 lg:px-8">
              <div className="flex items-center gap-4">
                <Link
                  href="/laudos"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Laudos
                </Link>
                <div className="w-px h-6 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Laudo Técnico</p>
                  <p className="font-mono font-semibold text-slate-800">{report.identification?.reportNumber || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                              <span className="hidden sm:block px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                                v{report.identification?.version || 1}
                              </span>
                              <button
                                                                                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600"
                                                                                            onClick={() => window.open(`/api/reports/${technicalReportId}/pdf`, '_blank')}
                                                                                            aria-label="Baixar PDF"
                                                                                            title="Baixar PDF"
                                                                                          >
                                                              <FileOutput className="w-5 h-5" />
                                                            </button>
                              <button
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-slate-100"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Abrir navegação do laudo"
                              >
                                <FileText className="w-5 h-5 text-slate-600" />
                              </button>
                            </div>
            </div>
          </header>

          {/* Report Content */}
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Professional EngeServ Report Header */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
                {/* EngeServ Brand Bar */}
                <div className="bg-navy px-6 py-4 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-white">EngeServ Inspector</h1>
                    <p className="text-navy-200 text-sm">Laudo Técnico de Inspeção</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono text-lg font-bold">{report.identification?.reportNumber || '—'}</p>
                    <p className="text-navy-200 text-xs">Versão {report.identification?.version || 1}</p>
                  </div>
                </div>

                {/* Status & Identification */}
                <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        report.identification?.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : report.identification?.status === "APPROVED"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : report.identification?.status === "UNDER_REVIEW"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : report.identification?.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {statusLabel[report.identification?.status || ''] || report.identification?.status || '—'}
                    </Badge>
                    <span className="px-3 py-1 bg-navy/10 text-navy text-sm font-medium rounded-lg">
                      {report.identification?.type || '—'}
                    </span>
                    {report.identification?.artNumber && (
                      <span className="text-xs text-slate-500">ART: {report.identification.artNumber}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    Emissão: {report.identification?.issuedAt
                      ? formatDate(report.identification.issuedAt)
                      : formatDate(report.identification?.createdAt)}
                  </div>
                </div>

                {/* Client + Equipment + Inspection Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  {/* Client */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-navy" />
                      <h3 className="font-semibold text-slate-800">Cliente</h3>
                    </div>
                    <p className="text-slate-900 font-medium">{report.client?.name || '—'}</p>
                    {report.client?.cnpj && <p className="text-sm text-slate-500">CNPJ: {report.client.cnpj}</p>}
                    {report.client?.address && <p className="text-sm text-slate-500 mt-1">{report.client.address}</p>}
                    {report.client?.city && report.client?.state && (
                      <p className="text-sm text-slate-500">
                        {report.client.city}, {report.client.state}
                      </p>
                    )}
                    {report.client?.responsibleTechnicalName && (
                      <p className="text-xs text-slate-500 mt-2">
                        Resp. Técnico: {report.client.responsibleTechnicalName}
                      </p>
                    )}
                  </div>

                  {/* Equipment */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Factory className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-800">Equipamento</h3>
                    </div>
                    <p className="text-slate-900 font-medium">
                      {report.equipment?.tag || '—'} — {(report.equipment?.type || '').replace(/_/g, " ")}
                    </p>
                    {report.equipment?.description && (
                      <p className="text-sm text-slate-600 mt-1">{report.equipment.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      {report.equipment?.manufacturer && (
                        <>
                          <span>Fabricante:</span>
                          <span className="text-slate-700">{report.equipment.manufacturer}</span>
                        </>
                      )}
                      {report.equipment?.serialNumber && (
                        <>
                          <span>N/S:</span>
                          <span className="text-slate-700">{report.equipment.serialNumber}</span>
                        </>
                      )}
                      {report.equipment?.manufactureYear && (
                        <>
                          <span>Ano fab.:</span>
                          <span className="text-slate-700">{report.equipment.manufactureYear}</span>
                        </>
                      )}
                      {report.equipment?.designCode && (
                        <>
                          <span>Norma:</span>
                          <span className="text-slate-700">{report.equipment.designCode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inspection Overview */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-slate-800">Inspeção</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-slate-500">Tipo:</span>
                      <span className="text-slate-700 font-medium">
                        {report.inspectionData?.inspection?.type || "PERIODICA"}
                      </span>
                      <span className="text-slate-500">Data:</span>
                      <span className="text-slate-700">
                        {formatDate(report.identification?.inspectionDate)}
                      </span>
                      <span className="text-slate-500">Inspetor:</span>
                      <span className="text-slate-700">{report.identification?.inspectorName || '—'}</span>
                      {report.identification?.engineerName && (
                        <>
                          <span className="text-slate-500">Engenheiro:</span>
                          <span className="text-slate-700">{report.identification.engineerName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Design Parameters (collapsible) */}
                <DesignParamsPanel equipment={report.equipment as any} />
              </div>

              {/* Report Body */}
              <div className="space-y-6">
                {/* Workflow Progress */}
                <ReportWorkflow
                                  report={report as any}
                                  activePanel={sidebarPanel}
                                  onPanelChange={setSidebarPanel}
                                  onAction={handleWorkflowAction}
                                />

                {/* Main Sections */}
                <div className="space-y-6">                   {activeSection === "resumo" && (
                    <ExecutiveSummary
                      report={report}
                      onVerdictChange={report.identification?.status !== "PUBLISHED" ? async (newStatus) => {
                        try {
                          const updatedSummary = { ...report.executiveSummary, overallStatus: newStatus };
                          const response = await fetch(`/api/reports/${technicalReportId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              status: report.identification?.status,
                              action: "update-verdict",
                              stepId: "verdict",
                              executiveSummary: updatedSummary,
                            }),
                          });
                          if (!response.ok) throw new Error("Erro ao atualizar veredito");
                          await loadReport();
                        } catch (err: any) {
                          alert(`Erro: ${err.message}`);
                        }
                      } : undefined}
                    />
                  )}
                  {activeSection === "preview" && (
                    <ReportPreview
                      report={report}
                      onExportPdf={handleExportPdf}
                      isExportingPdf={isExportingPdf}
                    />
                  )}
                  {activeSection === "inspecao" && (
                    <InspectionDataCard
                      inspection={report.inspectionData?.inspection as any}
                      equipment={report.inspectionData?.equipment as any}
                      client={report.inspectionData?.client as any}
                      stats={report.inspectionData?.measurementStats as any}
                    />
                  )}
                  {activeSection === "fotos" && (
                    <Attachments photos={report.attachments?.photos || []} documents={report.attachments?.documents || []} />
                  )}
                  {activeSection === "medicoes" && (
                    <MeasurementTable
                      measurements={report.inspectionData?.measurements || []}
                      stats={report.inspectionData?.measurementStats as any}
                    />
                  )}
                  {activeSection === "engenharia" && (
                    <EngineeringAnalysisCard
                      analysis={report.engineeringResults?.integrityAnalysis as any}
                      calculations={report.engineeringResults?.calculations || []}
                      simulations={report.engineeringResults?.simulations as any}
                    />
                  )}
                  {activeSection === "conclusao" && <TechnicalConclusion conclusion={report.technicalConclusion} />}
                  {activeSection === "recomendacoes" && (
                    <Recommendations recommendations={report.recommendations} nextInspection={report.nextInspection} />
                  )}
                  {activeSection === "anexos" && (
                    <Attachments photos={report.attachments?.photos || []} documents={report.attachments?.documents || []} />
                  )}
                  {activeSection === "historico" && <HistoryTimeline history={report.history as any} />}
                  {activeSection === "assinaturas" && (
                    <SignaturePanel
                      signatures={report.signatures}
                      onSign={handleSignAction}
                      reportStatus={report.identification.status}
                      manualSignatureMode={manualSignatureMode}
                      onToggleManualSignature={() => setManualSignatureMode(!manualSignatureMode)}
                    />
                  )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 py-8 border-t border-slate-200">
                  <p>EngeServ Inspector — Laudo Técnico {report.identification?.reportNumber || '—'}</p>
                  <p>
                    Gerado em {formatDate(new Date())} — Documento válido somente com assinatura do responsável
                    técnico
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================
// Design Parameters Panel
// ============================================
function DesignParamsPanel({ equipment }: { equipment: any }) {
  const [open, setOpen] = useState(false);
  if (!equipment) return null;

  return (
    <div className="border-t border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <span className="font-medium">Parâmetros de Projeto</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
          <Param label="Pressão Projeto" value={equipment.designPressureBar ? `${equipment.designPressureBar} bar` : "—"} icon={Gauge} />
          <Param label="Pressão Operação" value={equipment.operatingPressureBar ? `${equipment.operatingPressureBar} bar` : "—"} icon={Gauge} />
          <Param label="PMTA (MAWP)" value={equipment.mawpBar ? `${equipment.mawpBar} bar` : "—"} icon={Shield} />
          <Param label="Temp. Projeto" value={equipment.designTemperatureC ? `${equipment.designTemperatureC} °C` : "—"} icon={Thermometer} />
          <Param label="Temp. Operação" value={equipment.operatingTemperatureC ? `${equipment.operatingTemperatureC} °C` : "—"} icon={Thermometer} />
          <Param label="PTH" value={equipment.hydroTestPressureBar ? `${equipment.hydroTestPressureBar} bar` : "—"} icon={Droplets} />
          <Param label="Esp. Original" value={equipment.originalThicknessMm ? `${equipment.originalThicknessMm} mm` : "—"} icon={Ruler} />
          <Param label="Esp. Mínima" value={equipment.minThicknessMm ? `${equipment.minThicknessMm} mm` : "—"} icon={Ruler} />
          <Param label="Mat. Casco" value={equipment.bodyMaterial || "—"} icon={Package} />
          <Param label="Mat. Tampa" value={equipment.headMaterial || "—"} icon={Package} />
          <Param label="Tipo Tampa" value={equipment.headType || "—"} icon={Wrench} />
          <Param label="Efic. Solda" value={equipment.jointEfficiency ? `${(equipment.jointEfficiency * 100).toFixed(0)}%` : "—"} icon={Wrench} />
          <Param label="Volume" value={equipment.volumeLiters ? `${equipment.volumeLiters} L` : "—"} icon={Weight} />
          <Param label="Fluido" value={equipment.fluidType || "—"} icon={Droplets} />
          <Param label="Classe" value={equipment.fluidClass || "—"} icon={Shield} />
          <Param label="Grupo Risco" value={equipment.riskGroup ? `${equipment.riskGroup}` : "—"} icon={AlertCircle} />
          <Param label="Cat. NR-13" value={equipment.nr13Category || "—"} icon={Hash} />
          <Param label="Código Projeto" value={equipment.designCode || "—"} icon={FileText} />
        </div>
      )}
    </div>
  );
}

function Param({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-800 truncate" title={value}>
        {value}
      </p>
    </div>
  );
}

// ============================================
// Skeleton de seção (lazy-load)
// ============================================
function SectionSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-4 w-5/6 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================
function parseDates(obj: any): TechnicalReport {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.endsWith("At") || key.endsWith("Date") || key === "date" || key === "inspectionDate") {
      if (typeof obj[key] === "string") {
        obj[key] = new Date(obj[key]);
      }
    }
    if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(parseDates);
    } else if (obj[key] && typeof obj[key] === "object") {
      obj[key] = parseDates(obj[key]);
    }
  }
  return obj;
}
