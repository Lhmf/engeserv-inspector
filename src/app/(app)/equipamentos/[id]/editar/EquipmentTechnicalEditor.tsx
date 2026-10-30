"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Equipment = { id: string; tag: string; artNumber: string | null; designPressureBar: number | null; originalThicknessMm: number | null; minThicknessMm: number | null };

export default function EquipmentTechnicalEditor({ equipment }: { equipment: Equipment }) {
  const router = useRouter();
  const [values, setValues] = useState({
    artNumber: equipment.artNumber ?? "",
    designPressureBar: String(equipment.designPressureBar ?? ""),
    originalThicknessMm: String(equipment.originalThicknessMm ?? ""),
    minThicknessMm: String(equipment.minThicknessMm ?? ""),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const response = await fetch(`/api/equipamentos/${equipment.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        artNumber: values.artNumber || null,
        designPressureBar: Number(values.designPressureBar),
        originalThicknessMm: Number(values.originalThicknessMm),
        minThicknessMm: Number(values.minThicknessMm),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) { setError(data.error || "Não foi possível salvar a ficha técnica."); return; }
    router.push(`/equipamentos/${equipment.id}`);
    router.refresh();
  }

  return <div className="mx-auto max-w-2xl space-y-6">
    <div><Link href={`/equipamentos/${equipment.id}`} className="text-sm text-slate-600 hover:text-navy">← Voltar para o equipamento</Link><h1 className="mt-3 text-xl font-bold text-slate-800">Completar ficha técnica — {equipment.tag}</h1><p className="mt-1 text-sm text-slate-500">Esses dados são necessários para calcular o laudo NR-13.</p></div>
    <form onSubmit={save} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <label className="block text-sm font-medium text-slate-700">ART <span className="font-normal text-slate-500">(opcional)</span><input type="text" value={values.artNumber} onChange={(event) => setValues((current) => ({ ...current, artNumber: event.target.value.toUpperCase() }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Ex: 2026-0001234567" maxLength={80} /></label>
      {([['designPressureBar', 'Pressão de projeto (bar)'], ['originalThicknessMm', 'Espessura nominal do casco (mm)'], ['minThicknessMm', 'Espessura mínima admissível (mm)']] as const).map(([key, label]) => <label key={key} className="block text-sm font-medium text-slate-700">{label} <span className="text-red-500">*</span><input required type="number" min="0.01" step="0.01" value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label>)}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar ficha técnica"}</button>
    </form>
  </div>;
}
