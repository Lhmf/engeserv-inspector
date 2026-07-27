"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function NewTextTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      code: form.get("code"),
      title: form.get("title"),
      content: form.get("content"),
      category: form.get("category"),
    };

    try {
      const res = await fetch("/api/config/text-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      router.push("/configuracoes");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Novo Texto Padrão</h1>
          <p className="text-sm text-slate-500">
            Adicione um texto fixo para usar na geração de laudos
          </p>
        </div>
        <Link
          href="/configuracoes"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                type="text"
                required
                placeholder="Ex: REC_12_9"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <p className="mt-1 text-xs text-slate-400">
                Identificador único (ex: REC_12_1, AVISO_01)
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Categoria
              </label>
              <select
                name="category"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="RECOMENDACAO">Recomendação</option>
                <option value="AVISO">Aviso</option>
                <option value="CONCLUSAO">Conclusão</option>
                <option value="AVISO_REPARO">Aviso de Reparo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              placeholder="Ex: 12.9 - Teste de estanqueidade"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              required
              rows={6}
              placeholder="Texto completo da recomendação, aviso ou conclusão..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/configuracoes"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
