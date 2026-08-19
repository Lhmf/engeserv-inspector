"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CameraCapture, compressImage } from "@/components/CameraCapture";
import { useOnline } from "@/lib/useOnline";
import {
  saveDraft,
  getDraft,
  clearDraft,
  enqueuePhoto,
  getQueuedPhotos,
  removeQueuePhoto,
  getPendingSyncCount,
  type InspectionDraft,
} from "@/lib/offline";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Ruler,
  FileText,
  Send,
  X,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  FileOutput,
  Save,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Informações", description: "Tipo, observações iniciais", icon: FileText },
  { id: 2, title: "Fotografias", description: "Fotos categorizadas NR-13", icon: Camera },
  { id: 3, title: "Medições", description: "Espessura por ultrassom", icon: Ruler },
  { id: 4, title: "Observações", description: "Notas e recomendações", icon: FileText },
  { id: 5, title: "Revisão", description: "Enviar para aprovação", icon: Send },
];

const STEP_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-navy",
];

const inspectionSchema = z.object({
  type: z.enum(["INICIAL", "PERIODICA", "EXTRAORDINARIA"], {
    required_error: "Selecione o tipo de inspeção",
  }),
  initialNotes: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionSchema>;

const RECOMMENDATION_TEMPLATES = [
  "Inspeção visual anual conforme NR-13, item 13.7.2",
  "Teste hidrostático periódico a cada 5 (cinco) anos, ou conforme critério do profissional habilitado",
  "Substituição da válvula de segurança a cada 3 (três) anos ou conforme recomendação do fabricante",
  "Calibração anual de manômetros, pressostatos e instrumentos de medição, por laboratório acreditado pelo INMETRO",
  "Realização de inspeção visual e, se aplicável, ensaio não destrutivo (END) nas soldas a cada inspeção periódica",
  "Manutenção do sistema de proteção contra corrosão (pintura, revestimento ou proteção catódica), com retoques ou reaplicação conforme necessário",
  "Capacitação e treinamento periódico dos operadores responsáveis pela operação e monitoramento do equipamento, conforme exigência da NR-13, item 13.3.4",
  "Manutenção de registro atualizado de todas as manutenções, inspeções, reparos e alterações realizadas no equipamento, arquivados por período mínimo de 10 (dez) anos",
];

export default function InspectionWizardPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [inspection, setInspection] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loadingInspection, setLoadingInspection] = useState(true);
  const [offlinePhotos, setOfflinePhotos] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const online = useOnline();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: { type: "PERIODICA" },
  });

  const selectedType = watch("type") as string;
  const progress = (currentStep / STEPS.length) * 100;

  // Load inspection on mount
  useEffect(() => {
    loadInspection();
  }, [inspectionId]);

  // Recompute pending sync count whenever photos/measurements/notes change
  useEffect(() => {
    getPendingSyncCount().then(setPendingCount).catch(() => {});
  }, [photos, measurements, offlinePhotos]);

  async function loadInspection() {
    if (!inspectionId) return;
    setLoadingInspection(true);
    try {
      let insp: any = null;
      const res = await fetch(`/api/inspections/${inspectionId}`);
      const data = await res.json();
      if (res.ok) {
        insp = data.inspection;
      }

      // Prefer the local draft (may contain offline work) as the source of truth
      const draft = await getDraft(inspectionId);
      if (draft) {
        setTypeFromDraft(draft, insp);
      } else if (insp) {
        setInspection(insp);
        setPhotos(insp.photos || []);
        setMeasurements(insp.measurements || []);
        setNotes(insp.notes || "");
        setRecommendations(insp.recommendations || []);
        setValue("type", insp.type || "PERIODICA");
        setValue("initialNotes", insp.notes || "");
      } else if (!res.ok) {
        router.push("/inspecoes");
        return;
      }

      // Load offline queued photos for this inspection
      const queued = await getQueuedPhotos(inspectionId);
      setOfflinePhotos(queued.map((q) => ({ ...q, offline: true })));
    } catch (e) {
      console.error("Erro ao carregar inspeção", e);
      // Offline com draft salvo — ainda assim conseguimos trabalhar
      const draft = await getDraft(inspectionId);
      if (draft) {
        setPhysicalFromDraft(draft);
        const queued = await getQueuedPhotos(inspectionId);
        setOfflinePhotos(queued.map((q) => ({ ...q, offline: true })));
      } else {
        router.push("/inspecoes");
      }
    } finally {
      setLoadingInspection(false);
    }
  }

  function setTypeFromDraft(draft: InspectionDraft, insp?: any) {
    // Inspetão carregada da rede; usa o draft como override dos dados do wizard
    if (insp) setInspection(insp);
    setPhotos(insp?.photos || []);
    setMeasurements(draft.measurements || []);
    setNotes(draft.notes || "");
    setRecommendations(draft.recommendations || []);
    setValue("type", (draft.type as any) || insp?.type || "PERIODICA");
    setValue("initialNotes", draft.notes || "");
  }

  function setPhysicalFromDraft(draft: InspectionDraft) {
    setMeasurements(draft.measurements || []);
    setNotes(draft.notes || "");
    setRecommendations(draft.recommendations || []);
    setValue("type", (draft.type as any) || "PERIODICA");
    setValue("initialNotes", draft.notes || "");
  }

  // Save a local draft whenever fields change (debounced) — offline-safe
  useEffect(() => {
    if (loadingInspection) return;
    const t = setTimeout(() => {
      saveDraft({
        id: inspectionId,
        inspectionId,
        type: selectedType,
        notes,
        recommendations,
        measurements,
        updatedAt: Date.now(),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [selectedType, notes, recommendations, measurements, loadingInspection, inspectionId]);

  // Manual save with feedback (RC3: "Salvar rascunho")
  const [draftSaved, setDraftSaved] = useState(false);
  async function saveDraftNow() {
    await saveDraft({
      id: inspectionId,
      inspectionId,
      type: selectedType,
      notes,
      recommendations,
      measurements,
      updatedAt: Date.now(),
    }).catch(() => {});
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  }

  // Auto-save to network on step change (only when online)
  useEffect(() => {
    if (!loadingInspection && inspection) {
      autoSave();
    }
  }, [currentStep]);

  // Auto-flush queued photos when connection returns
  useEffect(() => {
    if (!online) return;
    flushOfflinePhotos();
  }, [online]);

  async function autoSave() {
    if (!inspectionId) return;
    if (!navigator.onLine) {
      console.log("[Offline] autoSave preservado como rascunho local");
      return;
    }
    try {
      await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          notes: notes || null,
          recommendations,
        }),
      });
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  }

  async function flushOfflinePhotos() {
    if (!inspectionId) return;
    try {
      const queued = await getQueuedPhotos(inspectionId);
      if (queued.length === 0) return;

      for (const q of queued) {
        const blob = dataUrlToBlob(q.dataUrl);
        const file = new File([blob], `offline-${q.category}-${Date.now()}.jpg`, { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("files", file);
        formData.append("category", q.category);
        if (q.caption) formData.append("caption", q.caption);

        const res = await fetch(`/api/inspections/${inspectionId}/photos`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao enviar foto");

        await removeQueuePhoto(q.id!);
        setPhotos((prev) => [...prev, ...data.photos]);
      }
      setOfflinePhotos([]);
      setPendingCount(await getPendingSyncCount());
      console.log(`[Sync] ${queued.length} foto(s) offline sincronizadas`);
    } catch (e) {
      console.error("[Sync] Falha ao sincronizar fotos:", e);
    }
  }

  function dataUrlToBlob(dataUrl: string): Blob {
    const [meta, b64] = dataUrl.split(",");
    const mime = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function enqueuePhotoLocal(blob: Blob, category: string) {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const id = await enqueuePhoto({ inspectionId, category, dataUrl });
    setOfflinePhotos((prev) => [...prev, { id, inspectionId, category, dataUrl, offline: true, createdAt: Date.now() }]);
    setPendingCount(await getPendingSyncCount());
  }

  async function onSubmit(data: InspectionFormData) {
    setSaving(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          notes: data.initialNotes || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      nextStep();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveMeasurements() {
    if (!inspectionId || measurements.length === 0) return;
    if (!navigator.onLine) {
      console.log("[Offline] medições preservadas no rascunho local");
      return;
    }
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/measurements/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ measurements }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Erro ao salvar medições:", err);
      }
    } catch (e) {
      console.error("Erro ao salvar medições:", e);
    }
  }

  function nextStep() {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }

  async function submitForReview() {
    setSaving(true);
    try {
      if (!navigator.onLine) {
        alert(
          "Você está offline. Seu rascunho foi salvo localmente no dispositivo e será enviado automaticamente quando a conexão voltar."
        );
        router.push(`/inspecoes/${inspectionId}`);
        return;
      }

      // Garante que fotos da fila sejam enviadas antes de finalizar
      await flushOfflinePhotos();

      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "AGUARDANDO_APROVACAO",
          completedAt: new Date().toISOString(),
          type: selectedType,
          notes: notes || null,
          recommendations,
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar para revisão");

      await saveMeasurements();
      await clearDraft(inspectionId);
      router.push(`/inspecoes/${inspectionId}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateReport() {
      setGeneratingReport(true);
      try {
        if (!navigator.onLine) {
          alert(
            "A geração do laudo requer conexão. Seus dados estão salvos localmente — volte assim que houver internet."
          );
          return;
        }

        await flushOfflinePhotos();
        await saveMeasurements();

        const res = await fetch("/api/reports/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inspectionId,
            equipmentId: inspection.equipment.id,
            options: {
              templateId: "DEFAULT_NR13",
              templateVersion: "1.0",
              includeSimulations: true,
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao gerar laudo");
        }

        const data = await res.json();
        // Usar o technicalReportId (ID real do banco) para redirecionar
        const redirectId = data.technicalReportId || data.reportId || data.report?.id;
        if (redirectId) {
          router.push(`/reports/${redirectId}`);
        } else {
          router.push(`/laudos`);
        }
      } catch (e: any) {
        alert("Erro ao gerar laudo: " + e.message);
      } finally {
        setGeneratingReport(false);
      }
    }

  // Step builders
  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return <StepInfo inspection={inspection} register={register} errors={errors} handleSubmit={handleSubmit} onSubmit={onSubmit} saving={saving} />;
      case 2:
        return (
          <StepPhotos
            inspectionId={inspectionId}
            photos={photos}
            setPhotos={setPhotos}
            onBack={prevStep}
            onNext={nextStep}
            offlinePhotos={offlinePhotos}
            onEnqueuePhoto={enqueuePhotoLocal}
          />
        );
      case 3:
        return <StepMeasurements measurements={measurements} setMeasurements={setMeasurements} minThickness={inspection?.equipment?.minThicknessMm} onBack={prevStep} onNext={() => { saveMeasurements(); nextStep(); }} />;
      case 4:
        return <StepObservations notes={notes} setNotes={setNotes} recommendations={recommendations} setRecommendations={setRecommendations} onBack={prevStep} onNext={nextStep} />;
      case 5:
        return (
          <StepReview
            inspection={inspection}
            selectedType={selectedType}
            photos={photos}
            measurements={measurements}
            notes={notes}
            recommendations={recommendations}
            onBack={prevStep}
            onSubmitReview={submitForReview}
            onGenerateReport={handleGenerateReport}
            saving={saving}
            generatingReport={generatingReport}
          />
        );
      default:
        return null;
    }
  }

  if (loadingInspection) {
    return (
      <div className="max-w-4xl mx-auto p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
        <p className="text-slate-600">Carregando inspeção...</p>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-slate-800">Inspeção não encontrada</h2>
        <Link href="/inspecoes" className="mt-4 inline-flex min-h-11 items-center rounded-lg px-3 text-navy hover:underline">Voltar para inspeções</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with progress */}
      <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#141e34]">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-800">
                  Etapa {currentStep} de {STEPS.length}
                </span>
                <span className="text-sm text-slate-500">{STEPS[currentStep - 1].title}</span>
              </div>
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
                    backgroundColor: idx < currentStep ? STEP_COLORS[idx] :
                                     idx === currentStep - 1 ? "white" : "white",
                    borderColor: idx < currentStep ? STEP_COLORS[idx] :
                                  idx === currentStep - 1 ? STEP_COLORS[idx] : "#e2e8f0",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex items-center justify-between text-xs text-slate-500 min-w-[420px]">
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
                    <Check className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className={cn(
                  "mt-1 text-center font-medium hidden sm:block",
                  idx === currentStep - 1 ? "text-navy" : "text-slate-500"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>

      {/* Equipment Info Bar */}
      {inspection && (
        <div className="rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-medium text-slate-700">
              <strong>{inspection.equipment.tag}</strong> — {inspection.equipment.type.replace("_", " ")}
            </span>
            <span className="text-slate-600">{inspection.equipment.client.companyName}</span>
            <Badge variant="outline" className="text-xs">
              {inspection.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      )}

      {/* Sticky bottom action bar (RC3 — alvo de toque no celular) */}
      <div className="sticky bottom-0 z-20 mt-4 space-y-3 rounded-t-2xl border-t border-slate-200 bg-white/95 px-2 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={prevStep} disabled={currentStep === 1} className="flex-1 min-h-12">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <Button variant="outline" onClick={saveDraftNow} className="flex-1 min-h-12">
            {draftSaved ? <Check className="w-4 h-4 mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            {draftSaved ? "Salvo!" : "Salvar"}
          </Button>
          <Button
            onClick={() => (currentStep === STEPS.length ? undefined : currentStep === STEPS.length - 1 ? submitForReview() : nextStep())}
            className="flex-1 min-h-12"
            disabled={saving}
          >
            {currentStep < STEPS.length - 1 ? "Próximo" : currentStep === STEPS.length - 1 ? "Revisar" : "Finalizar"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {draftSaved && (
          <p className="text-center text-xs font-medium text-emerald-600">Rascunho salvo localmente ✓</p>
        )}
        {!online && (
          <p className="text-center text-xs font-medium text-amber-600">
            Offline — autosave local ativo…
          </p>
        )}
      </div>
    </div>
  );
}

// ================================================================
// STEP 1: Informações Básicas
// ================================================================
function StepInfo({ inspection, register, errors, handleSubmit, onSubmit, saving }: any) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Informações Básicas</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {inspection?.equipment?.client?.companyName || "—"}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Equipamento</label>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {inspection?.equipment?.tag || "—"} — {inspection?.equipment?.type?.replace("_", " ") || "—"}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Tipo de Inspeção <span className="text-red-500">*</span>
        </label>
        <select
          {...register("type")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        >
          <option value="INICIAL">Inicial</option>
          <option value="PERIODICA">Periódica</option>
          <option value="EXTRAORDINARIA">Extraordinária</option>
        </select>
        {errors.type && <p className="mt-1 text-sm text-rose-600">{errors.type.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Observações Iniciais</label>
        <textarea
          {...register("initialNotes")}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          placeholder="Observações gerais sobre a inspeção..."
        />
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <Link href="/inspecoes" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">
          Cancelar
        </Link>
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar e Continuar"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}

// ================================================================
// STEP 2: Fotografias
// ================================================================
function StepPhotos({ inspectionId, photos, setPhotos, onBack, onNext, offlinePhotos, onEnqueuePhoto }: {
  inspectionId: string;
  photos: any[];
  setPhotos: (p: any[]) => void;
  onBack: () => void;
  onNext: () => void;
  offlinePhotos?: any[];
  onEnqueuePhoto?: (blob: Blob, category: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const online = useOnline();

  const categories = [
    "PLACA", "CORROSAO", "VALVULA", "MANOMETRO",
    "ULTRASSOM", "VISTA_GERAL", "SOLDA", "TRINCA", "REPARO"
  ];

  async function handleUpload(files: File[], category: string) {
    setUploading(true);
    try {
      if (!online) {
        // Offline: queue each file blob locally
        if (onEnqueuePhoto) {
          for (const f of files) {
            const blob = await compressImage(f, 0.72, 1600);
            await onEnqueuePhoto(blob, category);
          }
          alert("Você está offline. As fotos foram salvas localmente e serão enviadas quando a conexão voltar.");
        }
        return;
      }

      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      formData.append("category", category);

      const res = await fetch(`/api/inspections/${inspectionId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPhotos([...photos, ...data.photos]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleCameraUpload(blob: Blob, category: string) {
    setUploading(true);
    try {
      if (!online) {
        if (onEnqueuePhoto) {
          await onEnqueuePhoto(blob, category);
          alert("Você está offline. A foto foi salva localmente e será enviada quando a conexão voltar.");
        }
        return;
      }

      const file = new File([blob], `camera-${category}-${Date.now()}.jpg`, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("files", file);
      formData.append("category", category);

      const res = await fetch(`/api/inspections/${inspectionId}/photos`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPhotos([...photos, ...data.photos]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Fotografias NR-13</h3>
      <p className="text-sm text-slate-500">
        Adicione fotos categorizadas. Cada categoria deve ter pelo menos uma foto.
      </p>

      {!online && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <Clock className="w-4 h-4 flex-shrink-0" />
          Você está offline. Fotos capturadas serão salvas localmente e enviadas automaticamente quando a conexão voltar.
       </div>
      )}

      {/* Photo summary (RC3 — iAuditor-like) */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-700">Fotos da inspeção</p>
          <p className="text-xs text-slate-500">{photos.length} enviadas · {offlinePhotos?.length || 0} offline · {categories.length} categorias</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">
            <Camera className="w-4 h-4" />
            {photos.length}/{categories.length ? "foto" : "fotos"}
          </span>
        </div>
      </div>

      {offlinePhotos && offlinePhotos.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <p className="font-medium mb-1">
            {offlinePhotos.length} foto(s) aguardando sincronização
          </p>
          <div className="flex flex-wrap gap-2">
            {offlinePhotos.map((p) => (
              <img
                key={p.id}
                src={p.dataUrl}
                alt={`Offline ${p.category}`}
                className="w-16 h-16 object-cover rounded-lg border border-blue-200"
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {categories.map(cat => (
          <PhotoCategoryDropZone
            key={cat}
            category={cat}
            photos={photos.filter(p => p.category === cat)}
            onUpload={(files) => handleUpload(files, cat)}
            uploading={uploading}
            inspectionId={inspectionId}
            onCameraUpload={(blob) => handleCameraUpload(blob, cat)}
          />
        ))}
      </div>

      {photos.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-medium text-slate-800">Categorias ({new Set(photos.map(p => p.category)).size}/9)</h4>
          <div className="flex flex-wrap gap-2">
            {[...new Set(photos.map(p => p.category))].map(cat => (
              <Badge key={cat} variant="outline" className="gap-1">
                <Camera className="w-3 h-3" />
                {cat}
                <span className="text-xs ml-1">({photos.filter(p => p.category === cat).length})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext}>
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function PhotoCategoryDropZone({
  category, photos, onUpload, uploading, inspectionId, onCameraUpload
}: {
  category: string; photos: any[]; onUpload: (files: File[]) => void; uploading: boolean;
  inspectionId: string; onCameraUpload: (blob: Blob) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  };

  if (showCamera) {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-sm font-medium text-slate-700">{category}</span>
          <button
            onClick={() => setShowCamera(false)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Fechar
          </button>
        </div>
        <CameraCapture
          onCapture={(blob) => {
            onCameraUpload(blob);
            setShowCamera(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative rounded-xl border-2 border-dashed p-4 transition-colors",
      dragActive ? "border-navy bg-navy/5" : "border-slate-300 hover:border-navy"
    )}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) onUpload(files);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">{category}</p>
        <p className="text-xs text-slate-500 mb-2">Clique ou arraste fotos</p>

        {/* Camera quick capture */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowCamera(true); }}
          className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-full bg-navy/10 px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy/20 active:scale-95"
          title="Abrir câmera"
        >
          <Camera className="w-4 h-4" />
          Capturar
        </button>

        {photos.length > 0 && (
          <div className="mt-3 w-full">
            <div className="flex flex-wrap justify-center gap-1.5">
              {photos.slice(0, 4).map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt={`${category} ${p.caption ?? ""}`}
                  loading="lazy"
                  className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                />
              ))}
              {photos.length > 4 && (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                  +{photos.length - 4}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">{photos.length} foto(s)</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// STEP 3: Medições
// ================================================================
function StepMeasurements({ measurements, setMeasurements, minThickness, onBack, onNext }: {
  measurements: any[];
  setMeasurements: (m: any[]) => void;
  minThickness?: number | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const [rows, setRows] = useState<any[]>(
    measurements.length > 0 ? measurements : [{ point: "", thicknessMm: null, angleDeg: null, notes: "" }]
  );

  function updateRow(idx: number, field: string, value: any) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows(prev => [...prev, { point: "", thicknessMm: null, angleDeg: null, notes: "" }]);
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }

  useEffect(() => {
    setMeasurements(rows);
  }, [rows, setMeasurements]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Medições por Ultrassom</h3>
        <Button onClick={addRow} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Ponto
        </Button>
      </div>

      {/* Mobile measurement cards (< md) */}
      <div className="grid gap-3 md:hidden">
        {rows.map((row: any, idx: number) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">Ponto #{idx + 1}</span>
              <div className="flex items-center gap-2">
                {(() => {
                  if (!row.thicknessMm || !minThickness) return null;
                  const danger = row.thicknessMm <= minThickness;
                  const warn = row.thicknessMm <= minThickness * 1.2;
                  return (
                    <Badge variant="outline" className={danger
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : warn
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                      {danger ? "Crítico" : warn ? "Atenção" : "OK"}
                    </Badge>
                  );
                })()}
                <button
                  onClick={() => removeRow(idx)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50"
                  title="Remover ponto"
                  aria-label="Remover ponto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ponto</label>
                <input
                  type="text"
                  value={row.point}
                  onChange={(e) => updateRow(idx, "point", e.target.value)}
                  placeholder="P1, A-1..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Espessura (mm)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={row.thicknessMm ?? ""}
                  onChange={(e) => updateRow(idx, "thicknessMm", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Ângulo (°)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="360"
                  inputMode="numeric"
                  value={row.angleDeg ?? ""}
                  onChange={(e) => updateRow(idx, "angleDeg", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="0-360"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Observações</label>
                <input
                  type="text"
                  value={row.notes || ""}
                  onChange={(e) => updateRow(idx, "notes", e.target.value)}
                  placeholder="Notas..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-slate-500">
            Nenhuma medição adicionada. Clique em "Adicionar Ponto" para começar.
          </div>
        )}
      </div>

      {/* Desktop table (md+) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-500">
              <th className="px-3 py-2 text-left">Ponto</th>
              <th className="px-3 py-2 text-left">Espessura (mm)</th>
              <th className="px-3 py-2 text-left">Ângulo (°)</th>
              <th className="px-3 py-2 text-left">Observações</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.point}
                    onChange={(e) => updateRow(idx, "point", e.target.value)}
                    placeholder="P1, A-1..."
                    className="w-full rounded-md border border-slate-300 px-2 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.thicknessMm ?? ""}
                    onChange={(e) => updateRow(idx, "thicknessMm", e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-slate-300 px-2 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={row.angleDeg ?? ""}
                    onChange={(e) => updateRow(idx, "angleDeg", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="0-360"
                    className="w-full rounded-md border border-slate-300 px-2 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.notes || ""}
                    onChange={(e) => updateRow(idx, "notes", e.target.value)}
                    placeholder="Notas..."
                    className="w-full rounded-md border border-slate-300 px-2 py-2 min-h-11 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  {row.thicknessMm && minThickness ? (
                    <Badge variant="outline" className={
                      row.thicknessMm <= minThickness
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : row.thicknessMm <= minThickness * 1.2
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }>
                      {row.thicknessMm <= minThickness ? "Crítico" :
                       row.thicknessMm <= minThickness * 1.2 ? "Atenção" : "OK"}
                    </Badge>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeRow(idx)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-rose-500 hover:text-rose-700 text-sm"
                    title="Remover"
                    aria-label="Remover ponto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                  Nenhuma medição adicionada. Clique em "Adicionar Ponto" para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex justify-between border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext}>
          Salvar e Continuar
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ================================================================
// STEP 4: Observações
// ================================================================
function StepObservations({ notes, setNotes, recommendations, setRecommendations, onBack, onNext }: {
  notes: string;
  setNotes: (n: string) => void;
  recommendations: string[];
  setRecommendations: (r: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Observações e Recomendações</h3>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Observações Gerais</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Observações gerais sobre o estado do equipamento..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Recomendações (uma por linha)
          </label>
          <textarea
            value={recommendations.join("\n")}
            onChange={(e) => setRecommendations(e.target.value.split("\n").filter(Boolean))}
            rows={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
            placeholder="1. Inspeção visual anual conforme NR-13&#10;2. Teste hidrostático a cada 5 anos"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 text-sm font-medium text-slate-800">Modelos de Recomendação (clique para adicionar)</h4>
        <div className="flex flex-wrap gap-2">
          {RECOMMENDATION_TEMPLATES.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (!recommendations.includes(t)) {
                  setRecommendations([...recommendations, t]);
                }
              }}
              disabled={recommendations.includes(t)}
              className={cn(
                "inline-flex min-h-11 items-center px-4 py-2 text-sm rounded-full border transition-colors active:scale-95",
                recommendations.includes(t)
                  ? "bg-navy text-white border-navy"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext}>
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ================================================================
// STEP 5: Revisão e Finalização
// ================================================================
function StepReview({
  inspection, selectedType, photos, measurements, notes, recommendations,
  onBack, onSubmitReview, onGenerateReport, saving, generatingReport,
}: any) {
  const minThickness = measurements.length > 0
    ? Math.min(...measurements.map((m: any) => m.thicknessMm || Infinity))
    : null;
  const avgThickness = measurements.length > 0
    ? measurements.reduce((a: number, m: any) => a + (m.thicknessMm || 0), 0) / measurements.length
    : null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Revisão Final</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h5 className="mb-2 text-sm font-medium text-slate-700">Informações Básicas</h5>
          <div className="space-y-1 text-sm text-slate-600">
            <p><strong>Tipo:</strong> {selectedType}</p>
            <p><strong>Equipamento:</strong> {inspection?.equipment?.tag}</p>
            <p><strong>Cliente:</strong> {inspection?.equipment?.client?.companyName}</p>
            <p><strong>Inspetor:</strong> {inspection?.inspector?.name}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h5 className="mb-2 text-sm font-medium text-slate-700">Fotografias</h5>
          <div className="space-y-1 text-sm text-slate-600">
            <p><strong>Total:</strong> {photos.length} fotos</p>
            <p><strong>Categorias:</strong> {new Set(photos.map((p: any) => p.category)).size}/9</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h5 className="mb-2 text-sm font-medium text-slate-700">Medições</h5>
          <div className="space-y-1 text-sm text-slate-600">
            <p><strong>Pontos:</strong> {measurements.length}</p>
            <p><strong>Mínima:</strong> {minThickness !== null ? `${minThickness.toFixed(2)} mm` : "—"}</p>
            <p><strong>Média:</strong> {avgThickness !== null ? `${avgThickness.toFixed(2)} mm` : "—"}</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h5 className="mb-2 text-sm font-medium text-slate-700">Observações</h5>
          <div className="space-y-1 text-sm text-slate-600">
            <p><strong>Geral:</strong> {notes || "—"}</p>
            <p><strong>Recomendações:</strong> {recommendations.length} itens</p>
          </div>
        </div>
      </div>

      {photos.length < 3 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          Recomenda-se pelo menos 3 fotos (Placa, Vista Geral, Ultrassom)
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="secondary" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={onSubmitReview} disabled={saving || generatingReport} className="flex-1 sm:flex-none">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Enviar para Aprovação</>
            )}
          </Button>
          <Button
            onClick={onGenerateReport}
            disabled={generatingReport || saving}
            className="flex-1 sm:flex-none"
          >
            {generatingReport ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Gerando Laudo...</>
            ) : (
              <><FileOutput className="w-4 h-4 mr-2" />Gerar Laudo Técnico</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
