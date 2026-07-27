"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function EditTextTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    loadTemplate();
  }, []);

  async function loadTemplate() {
    try {
      const res = await fetch(`/api/config/text-templates/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTemplate(data.template);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
      active: form.get("active") === "true",
    };

    try {
      const res = await fetch(`/api/config/text-templates/${params.id}`, {
        method: "PUT",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-rose-700">{error}</p>
          <Link
            href="/configuracoes"
            className="mt-4 inline-block text-sm text-brand hover:underline"
          >
            Voltar para Configurações
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Editar Texto Padrão</h1>
          <p className="text-sm text-slate-500">{template?.code} — {template?.title}</p>
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
                defaultValue={template?.code}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Categoria
              </label>
              <select
                name="category"
                defaultValue={template?.category || "RECOMENDACAO"}
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
              defaultValue={template?.title}
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
              defaultValue={template?.content}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              name="active"
              defaultValue={template?.active ? "true" : "false"}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
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
