"use client";

import { useState } from "react";
import { FileUp, Download, ExternalLink } from "lucide-react";

type Site = { id: string; name: string };
type Document = { id: string; type: string; originalName: string; url: string; createdAt: string; site: Site | null; uploadedBy: { name: string } };

const typeLabels: Record<string, string> = { LAUDO: "Laudo", ART: "ART", INSPECAO: "Inspeção", OUTRO: "Outro" };

export function ClientDocumentsPanel({ clientId, sites, initialDocuments }: { clientId: string; sites: Site[]; initialDocuments: Document[] }) {
  const [open, setOpen] = useState(false); const [documents, setDocuments] = useState(initialDocuments); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await fetch(`/api/clientes/${clientId}/documents`, { method: "POST", body: new FormData(e.currentTarget) }); const data = await res.json(); setSaving(false);
    if (!res.ok) { setError(data.error || "Não foi possível importar o documento."); return; }
    setDocuments([{ ...data.document, site: sites.find((site) => site.id === data.document.siteId) || null, uploadedBy: { name: "Você" } }, ...documents]); setOpen(false); e.currentTarget.reset();
  }
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-800">Documentos</h2><p className="text-sm text-slate-500">Arquivos persistidos no histórico do cliente.</p></div><button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand"><FileUp className="h-4 w-4" /> Importar documento</button></div>
    {open && <form onSubmit={submit} className="mt-5 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2"><label className="text-sm font-medium text-slate-700">Tipo<select name="type" required className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"><option value="">Selecione</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Frente/local<select name="siteId" className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2"><option value="">Sem frente definida</option>{sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700 md:col-span-2">Arquivo<input name="file" type="file" required className="mt-1 block w-full text-sm" /></label>{error && <p className="text-sm text-rose-700 md:col-span-2">{error}</p>}<div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button><button disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Importando..." : "Importar"}</button></div></form>}
    <div className="mt-4 divide-y divide-slate-100">{documents.length ? documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-800">{document.originalName}</p><p className="text-xs text-slate-500">{typeLabels[document.type]} · {document.site?.name || "Sem frente definida"} · {new Date(document.createdAt).toLocaleDateString("pt-BR")} · {document.uploadedBy.name}</p></div><div className="flex gap-2"><a href={document.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-navy hover:bg-slate-100" aria-label="Abrir documento"><ExternalLink className="h-4 w-4" /></a><a href={document.url} download className="rounded-lg p-2 text-navy hover:bg-slate-100" aria-label="Baixar documento"><Download className="h-4 w-4" /></a></div></div>) : <p className="py-6 text-sm text-slate-500">Nenhum documento importado.</p>}</div>
  </section>;
}
