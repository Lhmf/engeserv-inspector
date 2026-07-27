"use client";

import { Building2, Factory, Calendar, MapPin, HardHat, Wrench, Scale, Gauge, ChevronDown, ChevronUp, TrendingUp, CheckCircle, AlertCircle, FileText, User, Calendar as CalendarIcon, Settings, ClipboardList } from "lucide-react";

interface InspectionDataCardProps {
  inspection: {
    id: string;
    equipmentId: string;
    inspectorId: string;
    status: string;
    startedAt: Date;
    completedAt?: Date;
    approvedAt?: Date;
    approvedById?: string;
    rejectionReason?: string;
    type: string;
    notes?: string;
    recommendations?: string[];
  };
  equipment: {
    id: string;
    tag: string;
    type: string;
    description?: string;
    manufacturer?: string;
    manufactureYear?: number;
    serialNumber?: string;
    designPressureBar?: number;
    designTemperatureC?: number;
    originalThicknessMm?: number;
    minThicknessMm?: number;
    corrosionAllowanceMm?: number;
    jointEfficiency?: number;
    designCode?: string;
    volumeLiters?: number;
    headType?: string;
    bodyMaterial?: string;
    headMaterial?: string;
    headNominalThicknessMm?: number;
    operatingPressureBar?: number;
    operatingTemperatureC?: number;
    mawpBar?: number;
    hydroTestPressureBar?: number;
    fluidType?: string;
    fluidClass?: string;
    riskGroup?: number;
    nr13Category?: string;
  };
  client: {
    id: string;
    name: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    responsibleTechnicalId?: string;
    responsibleTechnicalName?: string;
  };
  stats: {
    count: number;
    minThicknessMm: number;
    maxThicknessMm: number;
    avgThicknessMm: number;
    belowMinCount: number;
    belowMinPercentage: number;
  };
}

export function InspectionDataCard({ inspection, equipment, client, stats }: InspectionDataCardProps) {
  const getStatusBadge = (status: string) => {
    const badges = {
      APROVADA: "bg-emerald-100 text-emerald-700",
      EM_ANDAMENTO: "bg-blue-100 text-blue-700",
      AGUARDANDO_APROVACAO: "bg-amber-100 text-amber-700",
      REJEITADA: "bg-rose-100 text-rose-700",
    };
    return badges[status as keyof typeof badges] || "bg-slate-100 text-slate-700";
  };

  const formatDate = (date?: Date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getEquipmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CALDEIRA: "Caldeira",
      VASO_DE_PRESSAO: "Vaso de Pressão",
      SILO: "Silo",
      TANQUE: "Tanque",
      TUBULACAO: "Tubulação",
      COMPRESSOR: "Compressor",
      TROCADOR_DE_CALOR: "Trocador de Calor",
      REATOR: "Reator",
      OUTRO: "Outro",
    };
    return labels[type] || type;
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Dados da Inspeção</h2>
            <p className="text-sm text-slate-500">Informações gerais da inspeção e equipamento</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Inspection Status */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Status da Inspeção</p>
                <p className="font-semibold text-slate-800 capitalize">{inspection.status?.toLowerCase().replace("_", " ")}</p>
              </div>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(inspection.status)}`}>
              {inspection.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cliente */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4" />
              Cliente
            </div>
            <p className="font-medium text-slate-800">{client.name}</p>
            {client.cnpj && <p className="text-xs text-slate-500 mt-1">CNPJ: {client.cnpj}</p>}
            {client.city && client.state && <p className="text-xs text-slate-500 mt-1">{client.city} - {client.state}</p>}
            {client.responsibleTechnicalName && (
              <p className="text-xs text-slate-500 mt-1">Resp. Técnico: {client.responsibleTechnicalName}</p>
            )}
          </div>

          {/* Equipamento */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <Factory className="w-4 h-4" />
              Equipamento
            </div>
            <p className="font-medium text-slate-800">{equipment.tag}</p>
            <p className="text-xs text-slate-500 mt-1">{getEquipmentTypeLabel(equipment.type)}</p>
            {equipment.manufacturer && <p className="text-xs text-slate-500 mt-1">{equipment.manufacturer}</p>}
            {equipment.serialNumber && <p className="text-xs text-slate-500 mt-1">Série: {equipment.serialNumber}</p>}
            {equipment.manufactureYear && <p className="text-xs text-slate-500 mt-1">Ano: {equipment.manufactureYear}</p>}
          </div>

          {/* Inspeção */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <Calendar className="w-4 h-4" />
              Inspeção
            </div>
            <p className="font-medium text-slate-800 capitalize">{inspection.type?.toLowerCase()}</p>
            <p className="text-xs text-slate-500 mt-1">Início: {formatDate(inspection.startedAt)}</p>
            {inspection.completedAt && <p className="text-xs text-slate-500 mt-1">Conclusão: {formatDate(inspection.completedAt)}</p>}
            {inspection.approvedAt && <p className="text-xs text-slate-500 mt-1">Aprovado: {formatDate(inspection.approvedAt)}</p>}
          </div>

          {/* Dados de Projeto */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <Gauge className="w-4 h-4" />
              Dados de Projeto
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">P. Projeto:</span>
                <span className="font-medium">{equipment.designPressureBar} bar</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">T. Projeto:</span>
                <span className="font-medium">{equipment.designTemperatureC}°C</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Esp. Original:</span>
                <span className="font-medium">{equipment.originalThicknessMm} mm</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Esp. Mínima:</span>
                <span className="font-medium">{equipment.minThicknessMm} mm</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ca:</span>
                <span className="font-medium">{equipment.corrosionAllowanceMm} mm</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Ef. Junta:</span>
                <span className="font-medium">{equipment.jointEfficiency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Código:</span>
                <span className="font-medium">{equipment.designCode}</span>
              </div>
            </div>
          </div>

          {/* Dados Operacionais */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              Dados Operacionais
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">P. Operação:</span>
                <span className="font-medium">{equipment.operatingPressureBar} bar</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">T. Operação:</span>
                <span className="font-medium">{equipment.operatingTemperatureC}°C</span>
              </div>
              {equipment.mawpBar && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">PMTA:</span>
                  <span className="font-medium text-emerald-600">{equipment.mawpBar} bar</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">PTH:</span>
                <span className="font-medium">{equipment.hydroTestPressureBar} bar</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Fluido:</span>
                <span className="font-medium">{equipment.fluidType}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Classe:</span>
                <span className="font-medium">{equipment.fluidClass}</span>
              </div>
            </div>
          </div>

          {/* Estatísticas de Medição */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" />
              Estatísticas de Medição
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded p-3">
                <p className="text-2xl font-bold text-slate-800">{stats.count}</p>
                <p className="text-xs text-slate-500">Pontos</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-2xl font-bold text-slate-800">{stats.avgThicknessMm.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Média (mm)</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-2xl font-bold text-slate-800">{stats.minThicknessMm.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Mínima (mm)</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-2xl font-bold text-slate-800">{stats.maxThicknessMm.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Máxima (mm)</p>
              </div>
            </div>
            {stats.belowMinCount > 0 && (
              <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                ⚠ {stats.belowMinCount} pontos abaixo do mínimo ({stats.belowMinPercentage.toFixed(1)}%)
              </div>
            )}
          </div>
        </div>

        {/* Cronograma da Inspeção */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Cronograma da Inspeção
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Início</p>
                  <p className="font-medium text-slate-800">{formatDate(inspection.startedAt)}</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">{inspection.startedAt ? new Date(inspection.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}</span>
            </div>
            {inspection.completedAt && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Conclusão</p>
                    <p className="font-medium text-slate-800">{formatDate(inspection.completedAt)}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{new Date(inspection.completedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
            {inspection.approvedAt && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Aprovação</p>
                    <p className="font-medium text-slate-800">{formatDate(inspection.approvedAt)}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{new Date(inspection.approvedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
            {inspection.rejectionReason && (
              <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-rose-500 uppercase tracking-wider">Motivo da Rejeição</p>
                    <p className="font-medium text-rose-800">{inspection.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notas e Recomendações */}
        {(inspection.notes || inspection.recommendations?.length) && (
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas e Recomendações
            </h4>
            <div className="space-y-2">
              {inspection.notes && (
                <div className="p-3 bg-white rounded border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Observações</p>
                  <p className="text-slate-700">{inspection.notes}</p>
                </div>
              )}
              {inspection.recommendations?.length && (
                <div className="space-y-2 mt-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Recomendações da Inspeção</p>
                  <ul className="space-y-1">
                    {inspection.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 p-2 bg-white rounded border border-slate-200">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}