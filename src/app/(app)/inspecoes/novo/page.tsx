"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Plus, ChevronLeft, Loader2 } from "lucide-react";

const equipmentSchema = z.object({
  clientId: z.string().cuid("Selecione um cliente"),
  equipmentId: z.string().cuid("Selecione um equipamento"),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

export default function NewInspectionPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [clients, setClients] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
  });

  const loadClients = async () => {
    try {
      const res = await fetch("/api/clientes");
      const data = await res.json();
      setClients(data.clientes.filter((c: any) => c.active));
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
    }
  };

  const loadEquipments = async (clientId: string) => {
    try {
      const res = await fetch(`/api/equipamentos?clientId=${clientId}`);
      const data = await res.json();
      setEquipments(data.equipamentos.filter((e: any) => e.active));
    } catch (e) {
      console.error("Erro ao carregar equipamentos:", e);
    }
  };

  const handleClientChange = async (clientId: string) => {
    setClientId(clientId);
    if (clientId) {
      await loadEquipments(clientId);
    } else {
      setEquipments([]);
    }
  };

  const onSubmit = async (data: any) => {
    setCreating(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentId: data.equipmentId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push(`/inspecoes/${result.inspection.id}/wizard?step=1`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nova Inspeção</h1>
          <p className="text-sm text-slate-500">Selecione o cliente e equipamento para iniciar</p>
        </div>
        <Link href="/inspecoes" className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1 bg-slate-200 rounded-full">
          <div className="h-full bg-navy rounded-full" style={{ width: "0%" }} />
        </div>
        <span className="text-xs text-slate-500">1/5: Seleção do Equipamento</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold text-slate-800">Selecionar Cliente e Equipamento</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                {...register("clientId", { onChange: (e) => handleClientChange(e.target.value) })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                required
              >
                <option value="">— Selecione um cliente —</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-rose-600">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Equipamento <span className="text-red-500">*</span>
              </label>
              <select
                {...register("equipmentId")}
                disabled={!clientId}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:bg-slate-50"
                required
              >
                <option value="">— Selecione um equipamento —</option>
                {equipments.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.tag} — {e.type.replace("_", " ")}
                  </option>
                ))}
              </select>
              {errors.equipmentId && (
                <p className="mt-1 text-sm text-rose-600">{errors.equipmentId.message}</p>
              )}
            </div>
          </div>

          {clientId && equipments.length === 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              Este cliente não possui equipamentos ativos cadastrados.
              <Link href="/equipamentos/novo" className="ml-2 font-medium text-amber-700 hover:underline">
                Cadastrar equipamento
              </Link>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Link
              href="/inspecoes"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Cancelar
            </Link>
            <Button type="submit" disabled={creating} className="w-full sm:w-auto">
              {creating ? "Criando..." : "Iniciar Inspeção"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}