"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [responsibles, setResponsibles] = useState<Array<{ id: string; name: string; email: string }>>([]);

  async function fetchResponsibles() {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setResponsibles(
          data.users
            .filter((u: any) => u.role === "GESTOR" && u.active)
            .map((u: any) => ({ id: u.id, name: u.name, email: u.email }))
        );
      }
    } catch {
      console.error("Erro ao buscar responsáveis");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cnpj: cnpj || undefined,
          address: address || undefined,
          contactName: contactName || undefined,
          contactPhone: contactPhone || undefined,
          contactEmail: contactEmail || undefined,
          responsibleId: responsibleId || undefined,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Não foi possível criar o cliente.");
        return;
      }

      setSuccess("Cliente criado com sucesso!");
      setName("");
      setCnpj("");
      setAddress("");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setResponsibleId("");

      setTimeout(() => {
        router.push("/clientes");
        router.refresh();
      }, 1500);
    } catch {
      setLoading(false);
      setError("Erro de conexão. Tente novamente.");
    }
  }

  function formatCnpj(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 14) {
      return digits
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits.slice(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-navy">Clientes</h1>
          <p className="text-sm text-slate-500">Cadastro e gestão de clientes</p>
        </div>
        <Link
          href="/clientes"
          className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Voltar à listagem
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 lg:grid lg:grid-cols-4 lg:gap-6">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Razão social <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Empresa Ltda."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">CNPJ</label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </div>

        <div className="lg:col-span-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Endereço</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            placeholder="Rua, número, bairro, cidade, UF, CEP"
          />
        </div>

        <div className="lg:col-span-4 border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Dados de contato</h2>
          <div className="lg:grid lg:grid-cols-3 lg:gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome do contato</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="João da Silva"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefone do contato</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email do contato</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                placeholder="contato@empresa.com"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Responsável técnico</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Gestor responsável pelo cliente <span className="text-slate-400">(opcional)</span>
            </label>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
              className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">— Selecione um Gestor —</option>
              {responsibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Apenas Gestores ativos aparecem na lista.
            </p>
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
            href="/clientes"
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}