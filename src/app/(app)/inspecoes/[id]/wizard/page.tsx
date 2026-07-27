"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Ruler,
  FileText,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  X,
  Check,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  Box,
  ClipboardCheck,
  Activity,
  Upload,
  Download,
  Image,
  Trash2,
  Plus,
  Eye,
  Edit,
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
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [inspection, setInspection] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [clientId, setClientId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: { type: "PERIODICA" },
  });

  const selectedType = watch("type");
  const progress = (currentStep / STEPS.length) * 100;

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (clientId) {
      loadEquipments(clientId);
    } else {
      setEquipments([]);
      setEquipmentId("");
    }
  }, [clientId]);

  async function loadClients() {
    try {
      const res = await fetch("/api/clientes");
      const data = await res.json();
      setClients(data.clientes.filter((c: any) => c.active));
    } catch (e) {
      console.error("Erro ao carregar clientes", e);
    }
  }

  async function loadEquipments(clientId: string) {
    try {
      const res = await fetch(`/api/equipamentos?clientId=${clientId}`);
      const data = await res.json();
      setEquipments(data.equipamentos.filter((e: any) => e.active));
    } catch (e) {
      console.error("Erro ao carregar equipamentos", e);
    }
  }

  async function loadInspection(id: string) {
    try {
      const res = await fetch(`/api/inspections/${id}`);
      const data = await res.json();
      if (data.inspection) {
        setInspection(data.inspection);
        setPhotos(data.inspection.photos || []);
        setMeasurements(data.inspection.measurements || []);
        setInspectionId(id);
        
        // If coming from URL with step, use that
        const step = searchParams.get("step");
        if (step) {
          setCurrentStep(parseInt(step));
        }
      }
    } catch (e) {
      console.error("Erro ao carregar inspeção", e);
    }
  }

  // Load inspection on mount if ID in URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      loadInspection(id);
    }
  }, [searchParams]);

  // Auto-save on step change
  useEffect(() => {
    if (inspectionId && currentStep > 1) {
      autoSave();
    }
  }, [currentStep, selectedType, notes, recommendations]);

  async function autoSave() {
    if (!inspectionId) return;
    
    try {
      await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          notes,
          recommendations,
        }),
      });
    } catch (e) {
      console.error("Auto-save failed", e);
    }
  }

  async function onSubmit(data: InspectionFormData) {
    setSaving(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          type: data.type,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setInspectionId(result.inspection.id);
      setInspection(result.inspection);
      setCurrentStep(2);
      router.push(`/inspecoes/${result.inspection.id}/wizard?step=2`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  function nextStep() {
    if (currentStep < STEPS.length) {
      const next = currentStep + 1;
      setCurrentStep(next);
      router.push(`/inspecoes/${inspectionId}/wizard?step=${next}`);
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      router.push(`/inspecoes/${inspectionId}/wizard?step=${prev}`);
    }
  }

  async function submitForReview() {
    setSaving(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "AGUARDANDO_APROVACAO",
          completedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Erro ao enviar para revisão");

      router.push(`/inspecoes/${inspectionId}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Step Content
  const stepContent = (
    <>
      {/* Step 1: Basic Info */}
      {currentStep === 1 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Informações Básicas</h3>
            
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
              {errors.type && (
                <p className="mt-1 text-sm text-rose-600">{errors.type.message}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observações Iniciais
              </label>
              <textarea
                {...register("initialNotes")}
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Observações gerais sobre a inspeção..."
              />
            </div>
          </div>
        </form>
      )}

      {/* Step 2: Photos */}
      {currentStep === 2 && (
        <PhotoUploaderSection
          inspectionId={inspectionId!}
          photos={photos}
          setPhotos={setPhotos}
        />
      )}

      {/* Step 3: Measurements */}
      {currentStep === 3 && (
        <MeasurementGrid
          measurements={measurements}
          onChange={setMeasurements}
          minThickness={inspection?.equipment?.minThicknessMm}
        />
      )}

      {/* Step 4: Observations */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Observações e Recomendações</h3>
            
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observações Gerais
              </label>
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
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono text-sm"
                placeholder="1. Inspeção visual anual conforme NR-13&#10;2. Teste hidrostático a cada 5 anos&#10;3. Substituição da válvula de segurança a cada 3 anos"
              />
            </div>
          </div>

          <RecommendationTemplates
            selected={recommendations}
            onChange={setRecommendations}
          />
        </div>
      )}

      {/* Step 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Revisão Final</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <ReviewCard
                title="Informações Básicas"
                children={[
                  <p><strong>Tipo:</strong> {selectedType}</p>,
                  <p><strong>Equipamento:</strong> {inspection?.equipment?.tag}</p>,
                  <p><strong>Cliente:</strong> {inspection?.equipment?.client?.companyName}</p>,
                  <p><strong>Inspetor:</strong> {inspection?.inspector?.name}</p>,
                ]}
              />
              <ReviewCard
                title="Fotografias"
                children={[
                  <p><strong>Total:</strong> {photos.length} fotos</p>,
                  <p><strong>Categorias:</strong> {new Set(photos.map((p: any) => p.category)).size}/9</p>,
                ]}
              />
              <ReviewCard
                title="Medições"
                children={[
                  <p><strong>Pontos:</strong> {measurements.length}</p>,
                  <p><strong>Mínima:</strong> {measurements.length > 0 ? Math.min(...measurements.map((m: any) => m.thicknessMm)).toFixed(2) : "—"} mm</p>,
                  <p><strong>Média:</strong> {measurements.length > 0 ? (measurements.reduce((a: number, m: any) => a + m.thicknessMm, 0) / measurements.length).toFixed(2) : "—"} mm</p>,
                ]}
              />
              <ReviewCard
                title="Observações"
                children={[
                  <p><strong>Geral:</strong> {notes || "—"}</p>,
                  <p><strong>Recomendações:</strong> {recommendations.length} itens</p>,
                ]}
              />
            </div>

            {photos.length < 3 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">Recomenda-se pelo menos 3 fotos (Placa, Vista Geral, Ultrassom)</span>
                </div>
              </div>
            )}

            {measurements.length === 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">Nenhuma medição registrada</span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={submitForReview} disabled={saving} className="flex-1 sm:flex-none">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar para Aprovação
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with progress */}
      <div className="sticky top-4 z-10">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Progress Bar */}
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

          {/* Step Labels */}
          <div className="flex items-center justify-between text-xs text-slate-500">
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
                  "mt-1 text-center font-medium",
                  idx === currentStep - 1 ? "text-navy" : "text-slate-500"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-6">
          {stepContent}
        </div>

        {/* Navigation Buttons (hidden on step 5) */}
        {currentStep < 5 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex justify-between">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={nextStep} disabled={saving}>
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
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
    </div>
  );
}
// Helper Components
function PhotoUploaderSection({ 
  inspectionId, 
  photos, 
  setPhotos,
}: { 
  inspectionId: string;
  photos: any[];
  setPhotos: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [uploading, setUploading] = useState(false);

  const categories = [
    "PLACA", "CORROSAO", "VALVULA", "MANOMETRO",
    "ULTRASSOM", "VISTA_GERAL", "SOLDA", "TRINCA", "REPARO"
  ];

  async function handleUpload(files: File[], category: string) {
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      formData.append("category", category);
      
      const res = await fetch(`/api/inspections/${inspectionId}/photos`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPhotos(prev => [...prev, ...data.photos]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-800">Fotografias NR-13</h3>
        <p className="mb-4 text-sm text-slate-500">
          Adicione fotos categorizadas. Cada categoria deve ter pelo menos uma foto.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map(cat => (
            <PhotoCategoryDropZone
              key={cat}
              category={cat}
              photos={photos.filter(p => p.category === cat)}
              onUpload={(files) => handleUpload(files, cat)}
              uploading={uploading}
            />
          ))}
        </div>
      </div>

      <PhotoCategoriesList photos={photos} />
    </div>
  );
}

function PhotoCategoryDropZone({ 
  category, 
  photos, 
  onUpload, 
  uploading 
}: { 
  category: string;
  photos: any[];
  onUpload: (files: File[]) => void;
  uploading: boolean;
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files);
  };

  return (
    <div className={cn(
      "relative rounded-xl border-2 border-dashed p-4 transition-colors",
      dragActive ? "border-navy bg-navy/5" : "border-slate-300 hover:border-navy"
    )}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-700">{category}</p>
        <p className="text-xs text-slate-500 mb-2">Clique ou arraste fotos</p>
        
        {photos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 justify-center">
            {photos.slice(0, 3).map((photo: any) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption}
                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
              />
            ))}
            {photos.length > 3 && (
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-xs text-slate-600">+{photos.length - 3}</span>
              </div>
            )}
          </div>
        )}
        
        {photos.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">{photos.length} foto(s)</p>
        )}
      </div>
    </div>
  );
}

function PhotoCategoriesList({ photos }: { photos: any[] }) {
  if (photos.length === 0) return null;
  
  const categories = [...new Set(photos.map(p => p.category))];
  
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-medium text-slate-800">Categorias ({categories.length}/9)</h4>
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <Badge key={cat} variant="outline" className="gap-1">
            <Camera className="w-3 h-3" />
            {cat}
            <span className="text-xs">({photos.filter(p => p.category === cat).length})</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function MeasurementGrid({ 
  measurements, 
  onChange, 
  minThickness 
}: { 
  measurements: any[];
  onChange: (m: any[]) => void;
  minThickness?: number | null;
}) {
  const [rows, setRows] = useState(measurements.length > 0 ? measurements : [{ point: "", thicknessMm: "", angleDeg: "", notes: "" }]);

  useEffect(() => {
    onChange(rows);
  }, [rows, onChange]);

  function addRow() {
    setRows(prev => [...prev, { point: "", thicknessMm: "", angleDeg: "", notes: "" }]);
  }

  function updateRow(idx: number, field: string, value: any) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  function removeRow(idx: number) {
    setRows(prev => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Medições por Ultrassom</h3>
        <Button onClick={addRow} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Ponto
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase text-slate-500">
              <th className="px-3 py-2 text-left">Ponto</th>
              <th className="px-3 py-2 text-left">Espessura (mm)</th>
              <th className="px-3 py-2 text-left">Ângulo (°)</th>
              <th className="px-3 py-2 text-left">Observações</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.point}
                    onChange={(e) => updateRow(idx, "point", e.target.value)}
                    placeholder="P1, A-1..."
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.thicknessMm}
                    onChange={(e) => updateRow(idx, "thicknessMm", parseFloat(e.target.value) || null)}
                    placeholder="0.00"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="360"
                    value={row.angleDeg || ""}
                    onChange={(e) => updateRow(idx, "angleDeg", parseInt(e.target.value) || null)}
                    placeholder="0-360"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={row.notes || ""}
                    onChange={(e) => updateRow(idx, "notes", e.target.value)}
                    placeholder="Notas..."
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </td>
                <td className="px-3 py-2">
                  {row.thicknessMm && minThickness ? (
                    <Badge 
                      variant={parseFloat(row.thicknessMm) <= minThickness ? "danger" : 
                           parseFloat(row.thicknessMm) <= minThickness * 1.2 ? "warning" : "success"}
                      size="sm"
                      dot
                    >
                      {parseFloat(row.thicknessMm) <= minThickness ? "Crítico" : 
                       parseFloat(row.thicknessMm) <= minThickness * 1.2 ? "Atenção" : "OK"}
                    </Badge>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeRow(idx)}
                    className="text-rose-600 hover:text-rose-800 text-sm"
                  >
                    Remover
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
    </div>
  );
}

function RecommendationTemplates({ 
  selected, 
  onChange 
}: { 
  selected: string[];
  onChange: (recs: string[]) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-medium text-slate-800">Modelos de Recomendação (clique para adicionar)</h4>
      <div className="flex flex-wrap gap-2">
        {RECOMMENDATION_TEMPLATES.map((t, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (!selected.includes(t)) {
                onChange([...selected, t]);
              }
            }}
            disabled={selected.includes(t)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              selected.includes(t)
                ? "bg-navy text-white border-navy"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h5 className="mb-2 text-sm font-medium text-slate-700">{title}</h5>
      <div className="space-y-1 text-sm text-slate-600">{children}</div>
    </div>
  );
}