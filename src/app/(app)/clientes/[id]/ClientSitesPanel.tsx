"use client";

import { useState } from "react";
import { Plus, MapPin, Trash2, Edit2 } from "lucide-react";

type Site = { id: string; name: string; address: string | null; active: boolean };

export function ClientSitesPanel({ 
  clientId, 
  initialSites 
}: { 
  clientId: string; 
  initialSites: Site[];
}) {
  const [sites, setSites] = useState<Site[]>(initialSites);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = editingId 
      ? `/api/clientes//sites/`
      : `/api/clientes//sites`;
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), address: address.trim() || undefined }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || (editingId ? "Nao foi possivel atualizar a frente." : "Nao foi possivel criar a frente."));
      return;
    }

    if (editingId) {
      setSites(sites.map(s => s.id === editingId ? { ...s, ...data.site } : s));
    } else {
      setSites([data.site, ...sites]);
    }

    setName("");
    setAddress("");
    setEditingId(null);
    setOpen(false);
  }

  async function handleDelete(siteId: string) {
    if (!confirm("Tem certeza que deseja excluir esta frente? Equipamentos vinculados ficarao sem frente definida.")) return;

    const res = await fetch(`/api/clientes//sites/`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Nao foi possivel excluir a frente.");
      return;
    }
    setSites(sites.filter(s => s.id !== siteId));
  }

  function startEdit(site: Site) {
    setEditingId(site.id);
    setName(site.name);
    setAddress(site.address || "");
    setOpen(true);
  }

  function cancel() {
    setEditingId(null);
    setName("");
    setAddress("");
    setError("");
    setOpen(false);
  }

  return (    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-navy" />
            Frentes / Locais
          </h2>
          <p className="text-sm text-slate-500">Organize equipamentos, inspeccoes e documentos por local.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setName(""); setAddress(""); setError(""); setOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand">
          <Plus className="h-4 w-4" /> Adicionar frente/local
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Nome da frente/local <span className="text-red-500">*</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Ex: Andradina, Tres Lagoas, Unidade Industrial..."
              autoFocus
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Endereco / Identificacao (opcional)
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="Endereco, referencia, coordenadas..."
            />
          </label>
          {error && <p className="text-sm text-rose-700 md:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 md:col-span-2">
            <button type="button" onClick={cancel} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700">
              Cancelar
            </button>
            <button disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar frente"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4">
        {sites.length === 0 ? (
          <p className="py-6 text-sm text-slate-500 text-center">
            Nenhuma frente cadastrada. Clique em <span className="font-medium text-navy">"Adicionar frente/local"</span> para comecar.
          </p>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <div key={site.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-navy" />
                  <div>
                    <p className="font-medium text-slate-800">{site.name}</p>
                    {site.address && (
                      <p className="text-xs text-slate-500">{site.address}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {site.active ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(site)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Editar frente"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(site.id)}
                    className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    aria-label="Excluir frente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}