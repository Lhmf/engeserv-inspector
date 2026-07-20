"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEquipmentForm() {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [tag, setTag] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [manufactureYear, setManufactureYear] = useState("");
  const [designPressureBar, setDesignPressureBar] = useState("");
  const [originalThicknessMm, setOriginalThicknessMm] = useState("");
  const [minThicknessMm, setMinThicknessMm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<
    Array<{ id: string; companyName: string }>
  >([]);

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
  ];

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

  async function loadClients() {
    try {
      const res = await fetch("/api/clientes");
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients.filter((c: any) => c.active));
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
          description: description || null,
          manufacturer: manufacturer || null,
          manufactureYear: manufactureYear ? parseInt(manufactureYear) : null,
          designPressureBar: designPressureBar ? parseFloat(designPressureBar) : null,
          originalThicknessMm: originalThicknessMm ? parseFloat(originalThicknessMm) : null,
          minThicknessMm: minThicknessMm ? parseFloat(minThicknessMm) : null,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o equipamento.");
        return;
      }

      setSuccess("Equipamento criado com sucesso!");
      setClientId("");
      setTag("");
      setType("");
      setDescription("");
      setManufacturer("");
      setManufactureYear("");
      setDesignPressureBar("");
      setOriginalThicknessMm("");
      setMinThicknessMm("");

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
            <option value="">— Selecione o tipo —</option>
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Descrição do equipamento"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Fabricante</label>
          <input
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Ex: Petrobras, Gerdau, etc."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Ano de fabricação</label>
          <input
            type="number"
            value={manufactureYear}
            onChange={(e) => setManufactureYear(e.target.value)}
            min={1900}
            max={2100}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Ex: 2020"
          />
        </div>

        <div className="lg:col-span-2 border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Dados de projeto (para cálculos NR-13)</h2>
          <div className="lg:grid lg:grid-cols-3 lg:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Pressão de projeto (bar)
              </label>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Espessura original (mm)
              </label>
              <input
                type="number"
                step="0.01"
                value={originalThicknessMm}
                onChange={(e) => setOriginalThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 12.70"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Espessura mínima (mm)
              </label>
              <input
                type="number"
                step="0.01"
                value={minThicknessMm}
                onChange={(e) => setMinThicknessMm(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="Ex: 2.50"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
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