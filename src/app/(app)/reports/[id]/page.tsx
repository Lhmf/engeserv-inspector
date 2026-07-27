"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TechnicalReport } from "@/modules/report/types";
import { ReportHeader } from "@/components/report/ReportHeader";
import { ReportSidebar } from "@/components/report/ReportSidebar";
import { ReportWorkflow } from "@/components/report/ReportWorkflow";
import { ExecutiveSummary } from "@/components/report/ExecutiveSummary";
import { InspectionDataCard } from "@/components/report/InspectionDataCard";
import { MeasurementTable } from "@/components/report/MeasurementTable";
import { EngineeringAnalysisCard } from "@/components/report/EngineeringAnalysisCard";
import { TechnicalConclusion } from "@/components/report/TechnicalConclusion";
import { Recommendations } from "@/components/report/Recommendations";
import { Attachments } from "@/components/report/Attachments";
import { HistoryTimeline } from "@/components/report/HistoryTimeline";
import { SignaturePanel } from "@/components/report/SignaturePanel";
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
  FileText as FileTextIcon,
} from "lucide-react";
import Link from "next/link";

// ============================================
// SECTION DEFINITIONS
// ============================================

const SECTIONS = [
  { id: "resumo", label: "Resumo", icon: FileText },
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

type SectionId = typeof SECTIONS[number]["id"];

// ============================================
// MOCK REPORT DATA (simulating TechnicalReport type)
// ============================================

const mockReport: TechnicalReport = {
  id: "rpt-1",
  identification: {
    reportNumber: "LT-2024-00123",
    version: 2,
    type: "NR13",
    status: "DRAFT",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    inspectionDate: new Date("2024-01-10"),
    artNumber: "ART-2024-001",
    inspectorId: "insp-001",
    inspectorName: "João Silva",
    engineerId: "eng-001",
    engineerName: "Maria Santos",
    managerId: "mgr-001",
    managerName: "Carlos Oliveira",
  },
  client: {
    id: "cli-001",
    name: "Petrobras S.A.",
    cnpj: "00.000.000/0001-00",
    address: "Av. República do Chile, 65",
    city: "Rio de Janeiro",
    state: "RJ",
    contactName: "Roberto Costa",
    contactEmail: "roberto.costa@petrobras.com.br",
    contactPhone: "(21) 3214-5678",
    responsibleTechnicalId: "resp-001",
    responsibleTechnicalName: "Ana Paula Lima",
  },
  equipment: {
    id: "eqp-001",
    tag: "V-101",
    type: "VASO_DE_PRESSAO",
    description: "Vaso de Pressão - Separador de Óleo/Água",
    manufacturer: "Vasos Brasil Ltda",
    manufactureYear: 2018,
    serialNumber: "VB-2018-045",
    designPressureBar: 20,
    designTemperatureC: 120,
    originalThicknessMm: 12,
    minThicknessMm: 5.5,
    corrosionAllowanceMm: 3,
    jointEfficiency: 1.0,
    designCode: "ASME VIII-1",
    volumeLiters: 5000,
    headType: "Semielíptico",
    bodyMaterial: "SA-516 Gr.70",
    headMaterial: "SA-516 Gr.70",
    headNominalThicknessMm: 10,
    operatingPressureBar: 15,
    operatingTemperatureC: 80,
    mawpBar: 22.38,
    hydroTestPressureBar: 30,
    fluidType: "Óleo/Água",
    fluidClass: "B",
    riskGroup: 2,
    nr13Category: "II",
  },
  executiveSummary: {
    overview: "Inspeção periódica NR-13 realizada no vaso V-101 da Petrobras. O equipamento encontra-se em conformidade com os requisitos da NR-13 e ASME VIII-1. As medições de espessura indicam margem adequada em relação à espessura mínima admissível.",
    keyFindings: [
      "Espessura mínima medida: 8.2 mm (margem de 49% acima do mínimo)",
      "Taxa de corrosão: 0.133 mm/ano (baixa)",
      "Vida útil remanescente: 37.6 anos",
      "PMTA calculada: 22.38 bar (> pressão de operação 15 bar)",
    ],
    overallStatus: "INTEGRO",
    criticalityLevel: "LOW",
    requiresImmediateAction: false,
  },
  inspectionData: {
    inspection: {
      id: "insp-001",
      equipmentId: "eqp-001",
      inspectorId: "insp-001",
      status: "APROVADA",
      startedAt: new Date("2024-01-10T08:00:00"),
      completedAt: new Date("2024-01-10T16:00:00"),
      approvedAt: new Date("2024-01-12T10:00:00"),
      approvedById: "mgr-001",
      type: "PERIODICA",
      notes: "Inspeção periódica conforme cronograma NR-13",
      recommendations: ["Manter monitoramento", "Próxima inspeção em 12 meses"],
    },
    equipment: {
      id: "eqp-001",
      tag: "V-101",
      type: "VASO_DE_PRESSAO",
      description: "Vaso de Pressão - Separador de Óleo/Água",
      manufacturer: "Vasos Brasil Ltda",
      manufactureYear: 2018,
      serialNumber: "VB-2018-045",
      designPressureBar: 20,
      designTemperatureC: 120,
      originalThicknessMm: 12,
      minThicknessMm: 5.5,
      corrosionAllowanceMm: 3,
      jointEfficiency: 1.0,
      designCode: "ASME VIII-1",
      volumeLiters: 5000,
      headType: "Semielíptico",
      bodyMaterial: "SA-516 Gr.70",
      headMaterial: "SA-516 Gr.70",
      headNominalThicknessMm: 10,
      operatingPressureBar: 15,
      operatingTemperatureC: 80,
      mawpBar: 22.38,
      hydroTestPressureBar: 30,
      fluidType: "Óleo/Água",
      fluidClass: "B",
      riskGroup: 2,
      nr13Category: "II",
    },
    client: {
      id: "cli-001",
      name: "Petrobras S.A.",
      cnpj: "00.000.000/0001-00",
      address: "Av. República do Chile, 65",
      city: "Rio de Janeiro",
      state: "RJ",
      contactName: "Roberto Costa",
      contactEmail: "roberto.costa@petrobras.com.br",
      contactPhone: "(21) 3214-5678",
      responsibleTechnicalId: "resp-001",
      responsibleTechnicalName: "Ana Paula Lima",
    },
    measurements: [
      { id: "m1", inspectionId: "insp-001", point: "P1", thicknessMm: 9.1, angleDeg: 0, notes: "", createdAt: new Date(), updatedAt: new Date() },
      { id: "m2", inspectionId: "insp-001", point: "P2", thicknessMm: 8.9, angleDeg: 45, notes: "", createdAt: new Date(), updatedAt: new Date() },
      { id: "m3", inspectionId: "insp-001", point: "P3", thicknessMm: 8.2, angleDeg: 90, notes: "Ponto de menor espessura", createdAt: new Date(), updatedAt: new Date() },
      { id: "m4", inspectionId: "insp-001", point: "P4", thicknessMm: 9.5, angleDeg: 135, notes: "", createdAt: new Date(), updatedAt: new Date() },
      { id: "m5", inspectionId: "insp-001", point: "P5", thicknessMm: 9.0, angleDeg: 180, notes: "", createdAt: new Date(), updatedAt: new Date() },
      { id: "m6", inspectionId: "insp-001", point: "P6", thicknessMm: 8.8, angleDeg: 225, notes: "", createdAt: new Date(), updatedAt: new Date() },
      { id: "m7", inspectionId: "insp-001", point: "P7", thicknessMm: 9.2, angleDeg: 270, notes: "", createdAt: new Date(), updatedAt: new Date() },
      { id: "m8", inspectionId: "insp-001", point: "P8", thicknessMm: 8.5, angleDeg: 315, notes: "", createdAt: new Date(), updatedAt: new Date() },
    ],
    photos: [
      { id: "ph1", category: "PLACA", url: "/photos/placa-v101.jpg", caption: "Placa de identificação", order: 1, takenAt: new Date("2024-01-10T08:30:00"), takenBy: "João Silva" },
      { id: "ph2", category: "VISTA_GERAL", url: "/photos/vista-geral-v101.jpg", caption: "Vista geral do vaso", order: 2, takenAt: new Date("2024-01-10T09:00:00"), takenBy: "João Silva" },
      { id: "ph3", category: "ULTRASSOM", url: "/photos/ultrassom-v101.jpg", caption: "Pontos de medição ultrassom", order: 3, takenAt: new Date("2024-01-10T10:00:00"), takenBy: "João Silva" },
      { id: "ph4", category: "VALVULA", url: "/photos/valvula-v101.jpg", caption: "Válvula de segurança", order: 4, takenAt: new Date("2024-01-10T11:00:00"), takenBy: "João Silva" },
    ],
    measurementStats: {
      count: 8,
      minThicknessMm: 8.2,
      maxThicknessMm: 9.5,
      avgThicknessMm: 8.9,
      belowMinCount: 0,
      belowMinPercentage: 0,
    },
  },
  engineeringResults: {
    integrityAnalysis: {
      equipmentId: "eqp-001",
      inspectionId: "insp-001",
      analyzedAt: new Date("2024-01-12"),
      analyzedBy: "system",
      minimumThickness: {
        value: 5.5,
        unit: "mm",
        status: "SUCCESS",
        criticality: "LOW",
        explanation: "Espessura mínima calculada usando fórmula ASME VIII-1 (placeholder). VALOR NÃO VALIDADO - CONFIRMAR COM ENGENHEIRO.",
        normativeReference: "ASME BPVC VIII-1 UG-27 / NR-13 Item 13.5.2",
        reliability: "THEORETICAL",
        observations: ["IMPLEMENTAÇÃO PLACEHOLDER - NÃO USAR EM PRODUÇÃO", "Requer validação do engenheiro responsável", "Assumindo casco cilíndrico sob pressão interna", "Verificar se código de projeto correto foi selecionado"],
        metadata: { calculationId: "tmin-1705000000000", calculatedAt: new Date("2024-01-12"), calculatedBy: "system", formulaVersion: "1.0.0-placeholder", normativeVersion: "ASME 2021 / NR-13 2023", inputs: {}, warnings: ["CÁLCULO PLACEHOLDER - NÃO VALIDADO"] },
      },
      corrosionRate: {
        value: 0.133,
        unit: "mm/ano",
        status: "SUCCESS",
        criticality: "LOW",
        explanation: "Taxa de corrosão calculada: 0.133 mm/ano (5.2 mpy)",
        normativeReference: "API 570 Section 7 / API 510 Section 6 / NR-13",
        reliability: "MEDIUM",
        observations: ["Baseado em 2 pontos com intervalo adequado", "Intervalo de 1 ano entre inspeções"],
        metadata: { calculationId: "cr-1705000000000", calculatedAt: new Date("2024-01-12"), calculatedBy: "system", formulaVersion: "1.0.0", normativeVersion: "API 570 2016 / NR-13 2023", inputs: {}, warnings: [] },
      },
      remainingLife: {
        value: 37.6,
        unit: "anos",
        status: "SUCCESS",
        criticality: "LOW",
        explanation: "Vida útil remanescente calculada: 37.6 anos",
        normativeReference: "API 570 / API 510 / NR-13",
        reliability: "MEDIUM",
        observations: ["Baseado em taxa de corrosão de 0.133 mm/ano", "Margem de espessura atual: 2.7 mm"],
        metadata: { calculationId: "rl-1705000000000", calculatedAt: new Date("2024-01-12"), calculatedBy: "system", formulaVersion: "1.0.0", normativeVersion: "API 570 2016 / NR-13 2023", inputs: {}, warnings: [] },
      },
      mawp: {
        value: 22.38,
        unit: "bar",
        status: "SUCCESS",
        criticality: "LOW",
        explanation: "PMTA calculada baseada na espessura atual: 22.38 bar",
        normativeReference: "ASME VIII-1 UG-27 (inv.) / NR-13 13.5",
        reliability: "THEORETICAL",
        observations: ["PMTA (22.38 bar) > Pressão de operação (15 bar) - CONFORME"],
        metadata: { calculationId: "mawp-1705000000000", calculatedAt: new Date("2024-01-12"), calculatedBy: "system", formulaVersion: "1.0.0-placeholder", normativeVersion: "ASME 2021 / NR-13 2023", inputs: {}, warnings: ["CÁLCULO PLACEHOLDER - NÃO VALIDADO"] },
      },
      nextInspectionDate: {
        value: new Date("2025-01-10"),
        unit: "date",
        status: "SUCCESS",
        criticality: "LOW",
        explanation: "Próxima inspeção recomendada",
        normativeReference: "NR-13 Item 13.7",
        reliability: "HIGH",
        observations: [],
        metadata: { calculationId: "next-insp-1705000000000", calculatedAt: new Date("2024-01-12"), calculatedBy: "system", formulaVersion: "1.0.0", normativeVersion: "NR-13 2023", inputs: {}, warnings: [] },
      },
      overallStatus: "INTEGRO",
      overallCriticality: "LOW",
      recommendations: [
        "Equipamento íntegro - Continuar inspeções periódicas conforme cronograma",
        "Manter registros de medições para cálculo de taxa de corrosão",
      ],
      riskFactors: [],
      formulaVersions: { minimumThickness: "1.0.0-placeholder", corrosionRate: "1.0.0", remainingLife: "1.0.0", mawp: "1.0.0-placeholder" },
      normativeReferences: ["ASME BPVC VIII-1 2021", "API 570 2016", "API 510 2020", "NR-13 2023"],
    },
    calculations: [
      { 
        id: "tmin-1", 
        label: "Espessura Mínima Admissível", 
        value: "5.5", 
        unit: "mm",
        status: "SUCCESS", 
        criticality: "LOW",
        reliability: "THEORETICAL",
        explanation: "Espessura mínima calculada usando fórmula ASME VIII-1 (placeholder). VALOR NÃO VALIDADO - CONFIRMAR COM ENGENHEIRO.",
        normativeReference: "ASME VIII-1 UG-27",
        observations: ["IMPLEMENTAÇÃO PLACEHOLDER - NÃO USAR EM PRODUÇÃO", "Requer validação do engenheiro responsável"],
        rawValue: 5.5,
        metadata: { 
          calculationId: "tmin-1", 
          calculatedAt: new Date("2024-01-12"), 
          calculatedBy: "system", 
          formulaVersion: "1.0.0-placeholder", 
          normativeVersion: "ASME 2021 / NR-13 2023", 
          inputs: { designPressureBar: 20, insideDiameterMm: 1000, jointEfficiency: 1.0, allowableStressMpa: 138, corrosionAllowanceMm: 3 }, 
          warnings: ["CÁLCULO PLACEHOLDER - NÃO VALIDADO"] 
        }
      },
      { 
        id: "cr-1", 
        label: "Taxa de Corrosão", 
        value: "0.133", 
        unit: "mm/ano",
        status: "SUCCESS", 
        criticality: "LOW",
        reliability: "MEDIUM",
        explanation: "Taxa de corrosão calculada: 0.133 mm/ano (5.2 mpy)",
        normativeReference: "API 570 / API 510 / NR-13",
        observations: ["Baseado em 2 pontos com intervalo adequado", "Intervalo de 1 ano entre inspeções"],
        rawValue: 0.133,
        metadata: { 
          calculationId: "cr-1", 
          calculatedAt: new Date("2024-01-12"), 
          calculatedBy: "system", 
          formulaVersion: "1.0.0", 
          normativeVersion: "API 570 2016 / NR-13 2023", 
          inputs: { currentThicknessMm: 8.2, previousThicknessMm: 8.333, timeIntervalYears: 1 }, 
          warnings: [] 
        }
      },
      { 
        id: "rl-1", 
        label: "Vida Útil Remanescente", 
        value: "37.6", 
        unit: "anos",
        status: "SUCCESS", 
        criticality: "LOW",
        reliability: "MEDIUM",
        explanation: "Vida útil remanescente calculada: 37.6 anos",
        normativeReference: "API 570 / API 510 / NR-13",
        observations: ["Baseado em taxa de corrosão de 0.133 mm/ano", "Margem de espessura atual: 2.7 mm"],
        rawValue: 37.6,
        metadata: { 
          calculationId: "rl-1", 
          calculatedAt: new Date("2024-01-12"), 
          calculatedBy: "system", 
          formulaVersion: "1.0.0", 
          normativeVersion: "API 570 2016 / NR-13 2023", 
          inputs: { currentThicknessMm: 8.2, minimumThicknessMm: 5.5, corrosionRateMmPerYear: 0.133, safetyMarginMm: 1 }, 
          warnings: [] 
        }
      },
      { 
        id: "mawp-1", 
        label: "PMTA", 
        value: "22.38", 
        unit: "bar",
        status: "SUCCESS", 
        criticality: "LOW",
        reliability: "THEORETICAL",
        explanation: "PMTA calculada baseada na espessura atual: 22.38 bar",
        normativeReference: "ASME VIII-1 UG-27 (inv.) / NR-13",
        observations: ["PMTA (22.38 bar) > Pressão de operação (15 bar) - CONFORME"],
        rawValue: 22.38,
        metadata: { 
          calculationId: "mawp-1", 
          calculatedAt: new Date("2024-01-12"), 
          calculatedBy: "system", 
          formulaVersion: "1.0.0-placeholder", 
          normativeVersion: "ASME 2021 / NR-13 2023", 
          inputs: { currentThicknessMm: 8.2, insideDiameterMm: 1000, jointEfficiency: 1.0, allowableStressMpa: 138, corrosionAllowanceMm: 3, designCode: "ASME_VIII_DIV1" }, 
          warnings: ["CÁLCULO PLACEHOLDER - NÃO VALIDADO"] 
        }
      },
    ],
    simulations: [
      { scenario: "CURRENT_CONDITIONS", projectedThicknessMm: 7.07, projectedDate: new Date("2029-01-12"), willReachMinThickness: false, remainingLifeYears: 37.6, recommendedInspectionIntervalMonths: 12, warnings: ["Simulação baseada em taxa de corrosão assumida: 0.133 mm/ano"] },
    ],
    formulaVersions: { minimumThickness: "1.0.0-placeholder", corrosionRate: "1.0.0", remainingLife: "1.0.0", mawp: "1.0.0-placeholder" },
    normativeReferences: ["ASME BPVC VIII-1 2021", "API 570 2016", "API 510 2020", "NR-13 2023"],
  },
  technicalConclusion: {
    conclusion: "INTEGRO",
    justification: "O equipamento V-101 encontra-se em conformidade com os requisitos da NR-13 e ASME VIII-1. Todas as medições de espessura estão acima da espessura mínima admissível. A taxa de corrosão é baixa (0.133 mm/ano) e a PMTA calculada (22.38 bar) excede a pressão de operação (15 bar) com margem adequada.",
    riskFactors: [],
    complianceStatement: "Laudo elaborado conforme NR-13, ASME BPVC VIII-1 2021, API 570 2016, API 510 2020. Equipamento em conformidade com requisitos normativos aplicáveis.",
    restrictions: [],
  },
  recommendations: {
    immediate: [],
    shortTerm: [
      { id: "rec-1", description: "Manter monitoramento periódico da espessura", priority: "MEDIUM", category: "MONITOR" },
      { id: "rec-2", description: "Verificar válvulas de segurança na próxima inspeção", priority: "MEDIUM", category: "INSPECT" },
    ],
    mediumTerm: [
      { id: "rec-3", description: "Planejar inspeção interna detalhada em 2025", priority: "LOW", category: "INSPECT" },
    ],
    longTerm: [
      { id: "rec-4", description: "Avaliar necessidade de revestimento interno", priority: "LOW", category: "REPAIR" },
    ],
    inspection: {
      nextInspectionDate: new Date("2025-01-10"),
      intervalMonths: 12,
      type: "PERIODIC",
      scope: ["Inspeção visual completa", "Medições de espessura por ultrassom (8 pontos mínimos)", "Teste de válvulas de segurança", "Verificação de acessórios e instrumentação"],
      criteria: "Conforme NR-13 Item 13.7 e ASME VIII-1",
    },
  },
  nextInspection: {
    recommendedDate: new Date("2025-01-10"),
    maxIntervalMonths: 12,
    type: "PERIODIC",
    justification: "Intervalo padrão NR-13 para vasos de pressão categoria II",
    scope: ["Inspeção visual completa", "Medições de espessura por ultrassom (8 pontos mínimos)", "Teste de válvulas de segurança", "Verificação de acessórios e instrumentação"],
    acceptanceCriteria: "Conforme NR-13 Item 13.7 e ASME VIII-1",
  },
  attachments: {
    photos: [
      { id: "ph1", category: "PLACA", url: "/photos/placa-v101.jpg", caption: "Placa de identificação", order: 1, takenAt: new Date("2024-01-10T08:30:00"), takenBy: "João Silva" },
      { id: "ph2", category: "VISTA_GERAL", url: "/photos/vista-geral-v101.jpg", caption: "Vista geral do vaso", order: 2, takenAt: new Date("2024-01-10T09:00:00"), takenBy: "João Silva" },
      { id: "ph3", category: "ULTRASSOM", url: "/photos/ultrassom-v101.jpg", caption: "Pontos de medição ultrassom", order: 3, takenAt: new Date("2024-01-10T10:00:00"), takenBy: "João Silva" },
      { id: "ph4", category: "VALVULA", url: "/photos/valvula-v101.jpg", caption: "Válvula de segurança", order: 4, takenAt: new Date("2024-01-10T11:00:00"), takenBy: "João Silva" },
    ],
    documents: [],
    calculations: [],
  },
  history: {
    versions: [
      { version: 1, date: new Date("2024-01-15"), authorId: "insp-001", authorName: "João Silva", authorRole: "INSPECTOR", changes: "Criação do laudo", status: "DRAFT", action: "CREATED", previousVersion: undefined },
      { version: 2, date: new Date("2024-01-20"), authorId: "eng-001", authorName: "Maria Santos", authorRole: "ENGINEER", changes: "Revisão dos cálculos de engenharia e atualização do resumo executivo", status: "DRAFT", action: "VALIDATED", previousVersion: 1 },
    ],
    currentVersion: 2,
    totalVersions: 2,
  },
  validations: [
    { id: "val-1", reportId: "rpt-1", version: 2, validatedAt: new Date("2024-01-20"), validatedBy: "eng-001", validatorId: "eng-001", validatorName: "Maria Santos", validatorRole: "ENGINEER", validatedByRole: "ENGINEER", status: "APPROVED", isValid: true, passRate: 100, checklist: [
      { item: "Identificação completa", passed: true, required: true },
      { item: "Resumo executivo preenchido", passed: true, required: true },
      { item: "Dados da inspeção completos", passed: true, required: true },
      { item: "Resultados de engenharia presentes", passed: true, required: true },
      { item: "Conclusão técnica definida", passed: true, required: true },
      { item: "Próxima inspeção agendada", passed: true, required: true },
      { item: "Recomendações preenchidas", passed: true, required: true },
    ]},
  ],
  signatures: {
    inspector: undefined,
    engineer: undefined,
    manager: undefined,
    quality: undefined,
    requiredRoles: ["INSPECTOR", "ENGINEER", "MANAGER"],
    isComplete: false,
    missingRoles: ["INSPECTOR", "ENGINEER", "MANAGER"],
  },
  metadata: {
    templateId: "DEFAULT_NR13",
    templateVersion: "1.0",
    generatedBy: "insp-001",
    generatedAt: new Date("2024-01-15"),
    lastModifiedBy: "eng-001",
    lastModifiedAt: new Date("2024-01-20"),
    placeholderMode: true,
  },
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<TechnicalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("resumo");
  const [sidebarPanel, setSidebarPanel] = useState<"workflow" | "checklist" | "history">("workflow");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Simulate loading report data
  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this would be: const data = await fetchReport(reportId)
      // For now, use mock data if ID matches
      if (reportId === "rpt-1" || reportId === "1") {
        setReport(mockReport);
      } else {
        setError("Laudo não encontrado");
      }
      setLoading(false);
    };

    loadReport();
  }, [reportId]);

  const handleSidebarAction = (action: string) => {
    console.log("Workflow action:", action);
    // Handle workflow actions (complete, skip, etc.)
  };

  const handleBack = () => {
    router.push("/app/reports");
  };

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
          <button 
            onClick={handleBack}
            className="px-6 py-3 bg-navy text-white rounded-lg font-medium hover:bg-navy/90 transition-colors"
          >
            Voltar para Laudos
          </button>
        </div>
      </div>
    );
  }

  const sidebarSections = SECTIONS.map(s => ({
    id: s.id,
    label: s.label,
    icon: <s.icon className="w-5 h-5" />,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-navy text-white rounded-full shadow-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir navegação lateral"
      >
        <FileTextIcon className="w-6 h-6" />
      </button>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-0 h-screen w-80 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <ReportSidebar
            report={report}
            sections={sidebarSections}
            activeSection={activeSection}
            onSectionChange={(id: string) => setActiveSection(id as SectionId)}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0 min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between p-4 lg:px-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <Link 
                  href="/app/reports" 
                  className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Laudos
                </Link>
                <div className="hidden lg:block w-px h-6 bg-slate-200" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Laudo Técnico</p>
                  <p className="font-mono font-semibold text-slate-800">{report.identification.reportNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
                  <FileTextIcon className="w-5 h-5 text-slate-600" />
                </button>
                <span className="hidden sm:block px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                  v{report.identification.version}
                </span>
              </div>
            </div>
          </header>

          {/* Report Content */}
          <div className="p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Report Header */}
              <ReportHeader report={report} />
              
              <div className="mt-6 space-y-6">
                {/* Sidebar Panel (Workflow/Checklist/History) */}
                <div className="hidden lg:block">
                  <ReportWorkflow
                    report={report}
                    activePanel={sidebarPanel}
                    onPanelChange={setSidebarPanel}
                    onAction={handleSidebarAction}
                  />
                </div>

                {/* Main Report Sections */}
                <div className="lg:max-w-4xl">
                  {activeSection === "resumo" && (
                    <ExecutiveSummary report={report} />
                  )}

                  {activeSection === "inspecao" && (
                    <InspectionDataCard 
                      inspection={report.inspectionData.inspection}
                      equipment={report.inspectionData.equipment}
                      client={report.inspectionData.client}
                      stats={report.inspectionData.measurementStats}
                    />
                  )}

                  {activeSection === "fotos" && (
                    <Attachments 
                      photos={report.attachments.photos}
                      documents={report.attachments.documents}
                    />
                  )}

                  {activeSection === "medicoes" && (
                    <MeasurementTable 
                      measurements={report.inspectionData.measurements}
                      stats={report.inspectionData.measurementStats}
                    />
                  )}

                  {activeSection === "engenharia" && (
                    <EngineeringAnalysisCard
                      analysis={report.engineeringResults.integrityAnalysis}
                      calculations={report.engineeringResults.calculations}
                      simulations={report.engineeringResults.simulations}
                    />
                  )}

                  {activeSection === "conclusao" && (
                    <TechnicalConclusion 
                      conclusion={report.technicalConclusion}
                    />
                  )}

                  {activeSection === "recomendacoes" && (
                    <Recommendations 
                      recommendations={report.recommendations}
                      nextInspection={report.nextInspection}
                    />
                  )}

                  {activeSection === "anexos" && (
                    <Attachments 
                      photos={report.attachments.photos}
                      documents={report.attachments.documents}
                    />
                  )}

                  {activeSection === "historico" && (
                    <HistoryTimeline 
                      history={report.history}
                    />
                  )}

                  {activeSection === "assinaturas" && (
                    <SignaturePanel 
                      signatures={report.signatures}
                      onSign={() => {}}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}