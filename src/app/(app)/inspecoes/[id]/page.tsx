"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Camera,
  Ruler,
  FileText,
  Send,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Building2,
  Box,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Image,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, formatDate, formatDateTime, getStatusColor, getEquipmentTypeLabel } from "@/lib/utils";

interface Inspection {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  equipment: {
    id: string;
    tag: string;
    type: string;
    client: { companyName: string };
    minThicknessMm: number | null;
  };
  inspector: { id: string; name: string; email: string };
  approvedBy: { id: string; name: string; email: string } | null;
  photos: Array<{
    id: string;
    url: string;
    category: string;
    caption: string | null;
    order: number;
    uploadedBy: { name: string };
    createdAt: string;
  }>;
  measurements: Array<{
    id: string;
    point: string;
    thicknessMm: number;
    angleDeg: number | null;
    notes: string | null;
    createdAt: string;
  }>;
}

const STEPS = [
  { id: 1, title: "Informações", icon: FileText },
  { id: 2, title: "Fotografias", icon: Camera },
  { id: 3, title: "Medições", icon: Ruler },
  { id: 4, title: "Observações", icon: FileText },
  { id: 5, title: "Revisão", icon: Send },
];

const STEP_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-navy",
];

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "photos" | "measurements" | "timeline">("overview");
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    loadInspection();
    loadSession();
  }, [params.id]);

  async function loadSession() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) setUserRole(data.user.role);
    } catch {}
  }

  async function loadInspection() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inspections/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar inspeção");
      setInspection(data.inspection);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(inspectionId: string, status: string) {
    if (!status || !inspectionId) return;

    const body: Record<string, any> = { status };

    if (status === "REJEITADA") {
      const reason = window.prompt("Motivo da rejeição (obrigatório):");
      if (!reason || !reason.trim()) {
        alert("Motivo da rejeição é obrigatório.");
        return;
      }
      body.rejectionReason = reason.trim();
    }

    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao alterar status.");
        return;
      }
      setInspection(data.inspection);
    } catch (e: any) {
      alert("Erro ao alterar status: " + e.message);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-64 bg-slate-200 rounded mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Breadcrumbs items={[{ label: "Inspeções", href: "/inspecoes" }, { label: "Detalhes" }]} />
        <EmptyState
          title="Inspeção não encontrada"
          description={error || "Esta inspeção não existe ou foi removida."}
          action={{ label: "Voltar às inspeções", href: "/inspecoes" }}
        />
      </div>
    );
  }

  const canApprove = userRole === "GESTOR" || userRole === "ADMIN_MASTER";

  const { bg, text, border } = getStatusColor(inspection.status);
  const progress = getProgress(inspection.status);
  const currentStep = getCurrentStep(inspection.status);
  const equipmentType = getEquipmentTypeLabel(inspection.equipment.type);

  const minThickness = inspection.equipment.minThicknessMm;
  const measurements = inspection.measurements;
  const thicknesses = measurements.map((m) => m.thicknessMm);
  const minMeasured = thicknesses.length > 0 ? Math.min(...thicknesses) : null;
  const avgMeasured = thicknesses.length > 0
    ? thicknesses.reduce((a, b) => a + b, 0) / thicknesses.length
    : null;

  const photoCategories = [...new Set(inspection.photos.map((p) => p.category))];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Inspeções", href: "/inspecoes" },
          { label: inspection.equipment.tag, href: `/equipamentos/${inspection.equipment.id}` },
          { label: "Detalhes" },
        ]}
      />

      {/* Header with Status & Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">
                {inspection.equipment.tag} — {equipmentType}
              </h1>
              <Badge variant="outline" className={cn(bg, text, border)}>
                {inspection.status.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Cliente: <span className="font-medium text-slate-700">{inspection.equipment.client.companyName}</span>
              {" | Inspetor: "}
              <span className="font-medium text-slate-700">{inspection.inspector.name}</span>
            </p>
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setActionMenuOpen(actionMenuOpen === inspection.id ? null : inspection.id)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              aria-label="Ações da inspeção"
              aria-expanded={actionMenuOpen === inspection.id}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {actionMenuOpen === inspection.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                <div className="fixed right-4 top-16 z-20 rounded-xl border border-slate-200 bg-white shadow-lg py-1 min-w-[180px]">
                  <Link
                    href={`/inspecoes/${inspection.id}/wizard?step=${currentStep}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setActionMenuOpen(null)}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    Continuar Wizard
                  </Link>
                  {inspection.status === "EM_ANDAMENTO" && (
                    <button
                      onClick={() => handleStatusChange(inspection.id, "AGUARDANDO_APROVACAO")}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Send className="w-4 h-4" />
                      Enviar para Aprovação
                    </button>
                  )}
                  {inspection.status === "AGUARDANDO_APROVACAO" && canApprove && (
                    <>
                      <button
                        onClick={() => handleStatusChange(inspection.id, "APROVADA")}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleStatusChange(inspection.id, "REJEITADA")}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </>
                  )}
                  {inspection.status === "AGUARDANDO_APROVACAO" && !canApprove && (
                    <div className="px-4 py-2 text-xs text-slate-400 italic">
                      Aguardando aprovação de Gestor/Admin
                    </div>
                  )}
                  {inspection.status === "REJEITADA" && (
                    <button
                      onClick={() => handleStatusChange(inspection.id, "EM_ANDAMENTO")}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Reabrir Inspeção
                    </button>
                  )}
                  <hr className="my-1 border-slate-200" />
                  <button
                    onClick={() => window.print()}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / Salvar PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-800">Progresso da Inspeção</span>
            <span className="text-sm font-medium text-slate-600">{Math.round(progress)}%</span>
          </div>
          <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-navy rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white transition-all"
                style={{
                  left: `${(idx / (STEPS.length - 1)) * 100}%`,
                  backgroundColor: idx < currentStep - 1 ? STEP_COLORS[idx] : idx === currentStep - 1 ? "white" : "white",
                  borderColor: idx < currentStep - 1 ? STEP_COLORS[idx] : idx === currentStep - 1 ? STEP_COLORS[idx] : "#e2e8f0",
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center gap-1 relative",
                  idx < STEPS.length - 1 && "flex-1"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all mx-auto",
                    idx < currentStep - 1
                      ? "bg-navy text-white"
                      : idx === currentStep - 1
                      ? "bg-navy text-white ring-4 ring-navy/20"
                      : "bg-slate-200 text-slate-400"
                  )}
                >
                  {idx < currentStep - 1 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1 text-center font-medium",
                    idx === currentStep - 1 ? "text-navy" : "text-slate-500"
                  )}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <InfoCard label="Iniciada em" value={formatDate(inspection.startedAt)} icon={Calendar} />
          <InfoCard
            label="Concluída em"
            value={inspection.completedAt ? formatDate(inspection.completedAt) : "—"}
            icon={CheckCircle}
          />
          <InfoCard
            label="Aprovada em"
            value={inspection.approvedAt ? formatDate(inspection.approvedAt) : "—"}
            icon={inspection.approvedAt ? CheckCircle : Clock}
          />
          <InfoCard
            label="Aprovador"
            value={inspection.approvedBy?.name || "—"}
            icon={User}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1 p-1" aria-label="Abas da inspeção">
            {[
              { id: "overview", label: "Visão Geral", icon: ClipboardCheck },
              { id: "photos", label: `Fotos (${inspection.photos.length})`, icon: Camera },
              { id: "measurements", label: `Medições (${inspection.measurements.length})`, icon: Ruler },
              { id: "timeline", label: "Linha do Tempo", icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Equipment Info */}
              <section className="rounded-lg border border-slate-200 p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <Box className="w-5 h-5 text-navy" />
                  Equipamento
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="TAG" value={inspection.equipment.tag} />
                  <InfoRow label="Tipo" value={equipmentType} />
                  <InfoRow label="Cliente" value={inspection.equipment.client.companyName} />
                  <InfoRow
                    label="Espessura Mínima (projeto)"
                    value={inspection.equipment.minThicknessMm ? `${inspection.equipment.minThicknessMm} mm` : "Não informada"}
                  />
                </div>
              </section>

              {/* Inspection Summary */}
              <section className="rounded-lg border border-slate-200 p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
                  <FileText className="w-5 h-5 text-navy" />
                  Resumo da Inspeção
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatBox
                    label="Fotos"
                    value={inspection.photos.length}
                    subtitle={`${photoCategories.length}/9 categorias`}
                    icon={Camera}
                    color="purple"
                  />
                  <StatBox
                    label="Medições"
                    value={inspection.measurements.length}
                    subtitle={minMeasured !== null ? `Mín: ${minMeasured.toFixed(2)} mm` : "—"}
                    icon={Ruler}
                    color="amber"
                  />
                  <StatBox
                    label="Espessura Média"
                    value={avgMeasured !== null ? `${avgMeasured.toFixed(2)} mm` : "—"}
                    subtitle={minThickness ? `Limite: ${minThickness} mm` : "—"}
                    icon={Ruler}
                    color={avgMeasured !== null && minThickness && avgMeasured < minThickness ? "rose" : "emerald"}
                  />
                  <StatBox
                    label="Status Final"
                    value={inspection.status.replace("_", " ")}
                    subtitle={inspection.rejectionReason ? `Motivo: ${inspection.rejectionReason}` : undefined}
                    icon={
                      inspection.status === "APROVADA"
                        ? CheckCircle
                        : inspection.status === "REJEITADA"
                        ? XCircle
                        : inspection.status === "AGUARDANDO_APROVACAO"
                        ? Clock
                        : ClipboardCheck
                    }
                    color={
                      inspection.status === "APROVADA"
                        ? "emerald"
                        : inspection.status === "REJEITADA"
                        ? "rose"
                        : inspection.status === "AGUARDANDO_APROVACAO"
                        ? "amber"
                        : "blue"
                    }
                  />
                </div>
              </section>

              {/* Rejection Reason */}
              {inspection.rejectionReason && (
                <section className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-rose-800 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    Motivo da Rejeição
                  </h3>
                  <p className="text-rose-700">{inspection.rejectionReason}</p>
                </section>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-slate-200 pt-4">
                <Link
                  href={`/inspecoes/${inspection.id}/wizard?step=${currentStep}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-navy text-white font-medium hover:bg-navy/90 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                  Continuar Wizard
                </Link>
                <Link
                  href="/inspecoes"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar à Lista
                </Link>
              </div>
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === "photos" && (
            <PhotoGallery photos={inspection.photos} equipmentTag={inspection.equipment.tag} />
          )}

          {/* Measurements Tab */}
          {activeTab === "measurements" && (
            <MeasurementTable
              measurements={inspection.measurements}
              minThickness={inspection.equipment.minThicknessMm}
            />
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <InspectionTimeline
              inspection={inspection}
              equipmentTag={inspection.equipment.tag}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getProgress(status: string): number {
  const statusProgress: Record<string, number> = {
    EM_ANDAMENTO: 20,
    AGUARDANDO_APROVACAO: 80,
    APROVADA: 100,
    REJEITADA: 60,
  };
  return statusProgress[status] || 0;
}

function getCurrentStep(status: string): number {
  const stepMap: Record<string, number> = {
    EM_ANDAMENTO: 1,
    AGUARDANDO_APROVACAO: 5,
    APROVADA: 5,
    REJEITADA: 5,
  };
  return stepMap[status] || 1;
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
      <div className="p-2 bg-white rounded-lg text-slate-500">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };
  const colorClass = colors[color] || colors.blue;

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-2 rounded-lg", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function PhotoGallery({ photos, equipmentTag }: { photos: Inspection["photos"]; equipmentTag: string }) {
  if (photos.length === 0) {
    return (
      <EmptyState
        title="Nenhuma foto cadastrada"
        description="Adicione fotos categorizadas pelo wizard da inspeção."
        action={{ label: "Ir para Wizard", href: `/inspecoes/${photos[0]?.id ? "id" : ""}/wizard?step=2` }}
      />
    );
  }

  const categories = [...new Set(photos.map((p) => p.category))];

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95",
            "bg-navy text-white"
          )}
        >
          Todas ({photos.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className="inline-flex min-h-11 items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
          >
            {cat} ({photos.filter((p) => p.category === cat).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo) => (
          <div key={photo.id} className="group rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={photo.url}
                alt={photo.caption || photo.category}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <Camera className="w-3 h-3" />
                  {photo.category}
                </Badge>
              </div>
              <div className="absolute bottom-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white active:scale-95"
                  aria-label="Baixar foto"
                >
                  <Download className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-slate-800 line-clamp-1">
                {photo.caption || `${photo.category} - ${equipmentTag}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Por {photo.uploadedBy.name} • {formatDate(photo.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MeasurementTable({
  measurements,
  minThickness,
}: {
  measurements: Inspection["measurements"];
  minThickness: number | null;
}) {
  if (measurements.length === 0) {
    return (
      <EmptyState
        title="Nenhuma medição registrada"
        description="Adicione pontos de medição por ultrassom pelo wizard da inspeção."
        action={{ label: "Ir para Wizard", href: `/inspecoes/${measurements[0]?.id ? "id" : ""}/wizard?step=3` }}
      />
    );
  }

  const thicknesses = measurements.map((m) => m.thicknessMm);
  const minMeasured = Math.min(...thicknesses);
  const maxMeasured = Math.max(...thicknesses);
  const avgMeasured = thicknesses.reduce((a, b) => a + b, 0) / thicknesses.length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Menor Espessura</p>
          <p className="text-2xl font-bold text-slate-800">{minMeasured.toFixed(2)} mm</p>
          {minThickness && minMeasured <= minThickness && (
            <p className="text-xs text-rose-600 mt-1">⚠ Abaixo do mínimo de projeto ({minThickness} mm)</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Maior Espessura</p>
          <p className="text-2xl font-bold text-slate-800">{maxMeasured.toFixed(2)} mm</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Espessura Média</p>
          <p className="text-2xl font-bold text-slate-800">{avgMeasured.toFixed(2)} mm</p>
        </div>
      </div>

      {/* Mobile measurement cards (< md) */}
      <div className="grid gap-3 md:hidden">
        {measurements.map((m) => {
          let status: "OK" | "ATENÇÃO" | "CRÍTICO" = "OK";
          let statusColor = "text-emerald-600 bg-emerald-50";
          if (minThickness) {
            if (m.thicknessMm <= minThickness) {
              status = "CRÍTICO";
              statusColor = "text-rose-600 bg-rose-50";
            } else if (m.thicknessMm <= minThickness * 1.2) {
              status = "ATENÇÃO";
              statusColor = "text-amber-600 bg-amber-50";
            }
          }
          return (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-800">{m.point}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {m.angleDeg !== undefined ? `${m.angleDeg}°` : "Ângulo: —"}
                  </p>
                </div>
                <Badge variant="outline" className={statusColor} dot>
                  {status}
                </Badge>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Espessura</p>
                <p className="font-mono text-2xl font-bold text-slate-800">{m.thicknessMm.toFixed(2)} mm</p>
              </div>
              {m.notes && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">{m.notes}</p>
              )}
              <p className="mt-2 text-xs text-slate-400">Registrado em {formatDate(m.createdAt)}</p>
            </div>
          );
        })}
        {measurements.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
            Nenhuma medição registrada.
          </div>
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden rounded-lg border border-slate-200 overflow-hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Ponto</th>
              <th className="px-4 py-3 text-left">Espessura (mm)</th>
              <th className="px-4 py-3 text-left">Ângulo (°)</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Observações</th>
              <th className="px-4 py-3 text-left">Registrado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {measurements.map((m) => {
              let status: "OK" | "ATENÇÃO" | "CRÍTICO" = "OK";
              let statusColor = "text-emerald-600 bg-emerald-50";
              if (minThickness) {
                if (m.thicknessMm <= minThickness) {
                  status = "CRÍTICO";
                  statusColor = "text-rose-600 bg-rose-50";
                } else if (m.thicknessMm <= minThickness * 1.2) {
                  status = "ATENÇÃO";
                  statusColor = "text-amber-600 bg-amber-50";
                }
              }
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.point}</td>
                  <td className="px-4 py-3 text-slate-700">{m.thicknessMm.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-700">{m.angleDeg ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColor} dot>
                      {status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.notes || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InspectionTimeline({
  inspection,
  equipmentTag,
}: {
  inspection: Inspection;
  equipmentTag: string;
}) {
  const events = [
    {
      id: "created",
      title: "Inspeção Iniciada",
      description: `Inspetor ${inspection.inspector.name} criou a inspeção para ${equipmentTag}`,
      date: inspection.startedAt,
      icon: ClipboardCheck,
      color: "blue",
      status: "completed",
    },
    ...inspection.photos.map((p, i) => ({
      id: `photo-${p.id}`,
      title: `Foto Adicionada: ${p.category}`,
      description: p.caption || `Foto ${i + 1} da categoria ${p.category}`,
      date: p.createdAt,
      icon: Camera,
      color: "purple",
      status: "completed",
    })),
    ...inspection.measurements.map((m, i) => ({
      id: `measurement-${m.id}`,
      title: `Medição: Ponto ${m.point}`,
      description: `${m.thicknessMm.toFixed(2)} mm${m.angleDeg ? ` • Ângulo: ${m.angleDeg}°` : ""}`,
      date: m.createdAt,
      icon: Ruler,
      color: "amber",
      status: "completed",
    })),
    inspection.completedAt && {
      id: "completed",
      title: "Inspeção Concluída",
      description: "Enviada para revisão do gestor",
      date: inspection.completedAt,
      icon: Send,
      color: "purple",
      status: "completed",
    },
    inspection.approvedAt && {
      id: inspection.status === "APROVADA" ? "approved" : "rejected",
      title: inspection.status === "APROVADA" ? "Inspeção Aprovada" : "Inspeção Rejeitada",
      description: inspection.status === "APROVADA"
        ? `Aprovada por ${inspection.approvedBy?.name}`
        : `Rejeitada por ${inspection.approvedBy?.name}${inspection.rejectionReason ? `: ${inspection.rejectionReason}` : ""}`,
      date: inspection.approvedAt,
      icon: inspection.status === "APROVADA" ? CheckCircle : XCircle,
      color: inspection.status === "APROVADA" ? "emerald" : "rose",
      status: "completed",
    },
  ].filter(Boolean) as Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    icon: any;
    color: string;
    status: "completed";
  }>;

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
      <div className="space-y-6 ml-6">
        {events.map((event, idx) => (
          <div key={event.id} className="relative pl-6">
            <div className="absolute left-0 top-1 w-3 h-3 rounded-full border-4 border-white z-10" style={{ backgroundColor: colors[event.color] }} />
            {idx < events.length - 1 && (
              <div className="absolute left-0 top-5 w-0.5 h-full bg-slate-200" />
            )}
            <div className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${event.color}10` }}>
                  <event.icon className="w-5 h-5" style={{ color: colors[event.color] }} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{event.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                  <p className="text-xs text-slate-400 mt-2">{formatDateTime(event.date)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}