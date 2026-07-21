"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EQUIPMENT_TYPES = [
  "CALDEIRA",
  "VASO_DE_PRESSAO",
  "SILO",
  "TANQUE",
  "TUBULACAO",
  "COMPRESSOR",
  "TROCADOR_DE_CALOR",
  "REATOR",
  "OUTRO",
] as const;

const TYPE_LABELS: Record<string, string> = {
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

const HEAD_TYPES = [
  "Semieliptico",
  "Semiesferico",
  "Torisferico",
  "Plano",
  "Cone",
];

export default function NewEquipmentForm() {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [tag, setTag] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [designPressureBar, setDesignPressureBar] = useState("");
  const [designTempC, setDesignTempC] = useState("");
  const [operatingPressureBar, setOperatingPressureBar] = useState("");
  const [operatingTempC, setOperatingTempC] = useState("");
  const [mawpBar, setMawpBar] = useState("");
  const [hydroTestPressureBar, setHydroTestPressureBar] = useState("");
  const [headType, setHeadType] = useState("");
  const [headMaterial, setHeadMaterial] = useState("");
  const [bodyMaterial, setBodyMaterial] = useState("");
  const [originalThicknessMm, setOriginalThicknessMm] = useState("");
  const [headNominalThicknessMm, setHeadNominalThicknessMm] = useState("");
  const [minThicknessMm, setMinThicknessMm] = useState("");
  const [volumeLiters, setVolumeLiters] = useState("");
  const [jointEfficiency, setJointEfficiency] = useState("");
  const [fluidType, setFluidType] = useState("");
  const [fluidClass, setFluidClass] = useState("");
  const [riskGroup, setRiskGroup] = useState("");
  const [nr13Category, setNr13Category] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [designCode, setDesignCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; companyName: string }>>([]);

  const EQUIPMENT_TYPES = [
    "CALDEIRA",
    "VASO_DE_PRESSAO",
    "SILO",
    "TANQUE",
    "TUBULACAO",
    "COMPRESSOR",
    "TROCADOR_DE_CALOR",
    "REATOR",
    "OUTRO",
  ] as const;

  const TYPE_LABELS: Record<string, string> = {
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

  const HEAD_TYPES = [
    "Semieliptico",
    "Semiesferico",
    "Torisferico",
    "Plano",
    "Cone",
  ];

  async function loadClients() {
    try {
      const res = await fetch("/api/clientes");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clientes.filter((c: any) => c.active));
      }
    } catch {
      console.error("Erro ao buscar clientes");
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/equipamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          tag,
          type,
          description,
          manufacturer,
          manufactureYear: manufactureYear ? parseInt(manufactureYear) : null,
          designPressureBar: designPressureBar ? parseFloat(designPressureBar) : null,
          designTempC: designTempC ? parseFloat(designTempC) : null,
          operatingPressureBar: operatingPressureBar ? parseFloat(operatingPressureBar) : null,
          operatingTempC: operatingTempC ? parseFloat(operatingTempC) : null,
          mawpBar: mawpBar ? parseFloat(mawpBar) : null,
          hydroTestPressureBar: hydroTestPressureBar ? parseFloat(hydroTestPressureBar) : null,
          headType,
          headMaterial,
          bodyMaterial,
          originalThicknessMm: originalThicknessMm ? parseFloat(originalThicknessMm) : null,
          headNominalThicknessMm: headNominalThicknessMm ? parseFloat(headNominalThicknessMm) : null,
          minThicknessMm: minThicknessMm ? parseFloat(minThicknessMm) : null,
          volumeLiters: volumeLiters ? parseFloat(volumeLiters) : null,
          jointEfficiency: jointEfficiency ? parseFloat(jointEfficiency) : null,
          fluidType,
          fluidClass,
          riskGroup: riskGroup ? parseInt(riskGroup) : null,
          nr13Category,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o equipamento.");
        return;
      }

      setSuccess("Equipamento criado com sucesso!");
      setTimeout(() => {
        router.push("/equipamentos");
        router.refresh();
      }, 1500);
    } catch {
      setLoading(false);
      setError("Erro de conexão. Tente novamente.");
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-navy">Equipamentos</h1>
          <p className="text-sm text-slate-500">Cadastro de equipamentos vinculados a clientes</p>
        </div>
        <Link
          href="/equipamentos"
          className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Voltar à listagem
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="lg:col-span-2 border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Identificação</h2>
          <div className="lg:grid lg:grid-cols-4 lg:gap-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">— Selecione um cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                TAG <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={tag}
                onChange={(e) => setTag(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: V-101"
                maxLength={50}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">— Selecione —</option>
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t as keyof typeof TYPE_LABELS]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Número de Série</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 352549"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Código de Projeto</label>
              <input
                type="text"
                value={designCode}
                onChange={(e) => setDesignCode(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: ASME SEC.VIII div.I/2021"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Descrição do equipamento"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Dados de Projeto</h2>
          <div className="lg:grid lg:grid-cols-3 lg:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Pressão de Projeto (bar)</label>
              <input
                type="number"
                step="0.01"
                value={designPressureBar}
                onChange={(e) => setDesignPressureBar(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 12.50"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Temp. de Projeto (°C)</label>
              <input
                type="number"
                step="0.1"
                value={designTempC}
                onChange={(e) => setDesignTempC(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Pressão de Operação (bar)</label>
              <input
                type="number"
                step="0.01"
                value={operatingPressureBar}
                onChange={(e) => setOperatingPressureBar(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 9.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Temp. de Operação (°C)</label>
              <input
                type="number"
                step="0.1"
                value={operatingTempC}
                onChange={(e) => setOperatingTempC(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 60"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">PMTA (bar)</label>
              <input
                type="number"
                step="0.01"
                value={mawpBar}
                onChange={(e) => setMawpBar(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 10.60"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">PTH (bar)</label>
              <input
                type="number"
                step="0.01"
                value={hydroTestPressureBar}
                onChange={(e) => setHydroTestPressureBar(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 13.90"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Geometria e Material</h2>
          <div className="lg:grid lg:grid-cols-4 lg:gap-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Tampo</label>
              <select
                value={headType}
                onChange={(e) => setHeadType(e.target.value)}
                className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">— Selecione —</option>
                {HEAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material do Tampo</label>
              <input
                type="text"
                value={headMaterial}
                onChange={(e) => setHeadMaterial(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: SA-36"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material do Corpo</label>
              <input
                type="text"
                value={bodyMaterial}
                onChange={(e) => setBodyMaterial(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: SA-516 Gr.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Esp. Nominal Casco (mm)</label>
              <input
                type="number"
                step="0.01"
                value={originalThicknessMm}
                onChange={(e) => setOriginalThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 3.47"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Esp. Nominal Tampos (mm)</label>
              <input
                type="number"
                step="0.01"
                value={headNominalThicknessMm}
                onChange={(e) => setHeadNominalThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 3.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Esp. Mínima (mm)</label>
              <input
                type="number"
                step="0.01"
                value={minThicknessMm}
                onChange={(e) => setMinThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 2.50"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Volume (litros)</label>
              <input
                type="number"
                step="0.01"
                value={volumeLiters}
                onChange={(e) => setVolumeLiters(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 150.0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Eficiência de Solda</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={jointEfficiency}
                onChange={(e) => setJointEfficiency(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 0.70"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Fluido e Classificação NR-13</h2>
          <div className="lg:grid lg:grid-cols-4 lg:gap-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Fluido</label>
              <input
                type="text"
                value={fluidType}
                onChange={(e) => setFluidType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: Ar Comprimido"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Classe do Fluido (A/B/C/D)</label>
              <input
                type="text"
                value={fluidClass}
                onChange={(e) => setFluidClass(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="A/B/C/D"
                maxLength={1}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grupo de Risco</label>
              <input
                type="number"
                value={riskGroup}
                onChange={(e) => setRiskGroup(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categoria NR-13 (I a V)</label>
              <input
                type="text"
                value={nr13Category}
                onChange={(e) => setNr13Category(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="I, II, III, IV, V"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Dados do Fabricante</h2>
          <div className="lg:grid lg:grid-cols-4 lg:gap-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Fabricante</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: Chiaperini"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ano de Fabricação</label>
              <input
                type="number"
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
                min={1900}
                max={2100}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 2024"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Tampo</label>
              <select
                value={headType}
                onChange={(e) => setHeadType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">— Selecione —</option>
                {HEAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material do Tampo</label>
              <input
                type="text"
                value={headMaterial}
                onChange={(e) => setHeadMaterial(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: SA-36"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material do Corpo</label>
              <input
                type="text"
                value={bodyMaterial}
                onChange={(e) => setBodyMaterial(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: SA-516 Gr.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Esp. Nominal Tampos (mm)</label>
              <input
                type="number"
                step="0.01"
                value={headNominalThicknessMm}
                onChange={(e) => setHeadNominalThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 3.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Volume (litros)</label>
              <input
                type="number"
                step="0.01"
                value={volumeLiters}
                onChange={(e) => setVolumeLiters(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 150.0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Eficiência de Solda</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={jointEfficiency}
                onChange={(e) => setJointEfficiency(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 0.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fluido</label>
              <input
                type="text"
                value={fluidType}
                onChange={(e) => setFluidType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: Ar Comprimido"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Classe do Fluido</label>
              <input
                type="text"
                value={fluidClass}
                onChange={(e) => setFluidClass(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="A/B/C/D"
                maxLength={1}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grupo de Risco</label>
              <input
                type="number"
                value={riskGroup}
                onChange={(e) => setRiskGroup(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categoria NR-13</label>
              <input
                type="text"
                value={nr13Category}
                onChange={(e) => setNr13Category(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="I, II, III, IV, V"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Identificação Adicional</h2>
          <div className="lg:grid lg:grid-cols-3 lg:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Número de Série</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 352549"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Código de Projeto</label>
              <input
                type="text"
                value={designCode}
                onChange={(e) => setDesignCode(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: ASME SEC.VIII div.I/2021"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de Tampo</label>
              <select
                value={headType}
                onChange={(e) => setHeadType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">— Selecione —</option>
                {HEAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material do Tampo</label>
              <input
                type="text"
                value={headMaterial}
                onChange={(e) => setHeadMaterial(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: SA-36"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Material do Corpo</label>
              <input
                type="text"
                value={bodyMaterial}
                onChange={(e) => setBodyMaterial(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: SA-516 Gr.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Esp. Nominal Tampos (mm)</label>
              <input
                type="number"
                step="0.01"
                value={headNominalThicknessMm}
                onChange={(e) => setHeadNominalThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 3.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Volume (litros)</label>
              <input
                type="number"
                step="0.01"
                value={volumeLiters}
                onChange={(e) => setVolumeLiters(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 150.0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Eficiência de Solda</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={jointEfficiency}
                onChange={(e) => setJointEfficiency(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 0.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Fluido</label>
              <input
                type="text"
                value={fluidType}
                onChange={(e) => setFluidType(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: Ar Comprimido"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Classe do Fluido</label>
              <input
                type="text"
                value={fluidClass}
                onChange={(e) => setFluidClass(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="A/B/C/D"
                maxLength={1}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Grupo de Risco</label>
              <input
                type="number"
                value={riskGroup}
                onChange={(e) => setRiskGroup(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 5"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Categoria NR-13</label>
              <input
                type="text"
                value={nr13Category}
                onChange={(e) => setNr13Category(e.target.value.toUpperCase())}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="I, II, III, IV, V"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link
            href="/equipamentos"
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar equipamento"}
          </button>
        </div>
      </form>
    </div>
  );
}