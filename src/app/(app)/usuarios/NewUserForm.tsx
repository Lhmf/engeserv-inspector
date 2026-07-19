"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewUserForm({ canCreateGestor }: { canCreateGestor: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"GESTOR" | "FUNCIONARIO">("FUNCIONARIO");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Nao foi possivel criar o usuario.");
      return;
    }

    setSuccess("Usuario criado com sucesso.");
    setName("");
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
    >
      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Senha provisoria</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-slate-600">Papel</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "GESTOR" | "FUNCIONARIO")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="FUNCIONARIO">Funcionario</option>
          {canCreateGestor && <option value="GESTOR">Gestor</option>}
        </select>
      </div>
      <div className="lg:col-span-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
        >
          {loading ? "Criando..." : "Criar usuario"}
        </button>
      </div>

      {error && (
        <p className="lg:col-span-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="lg:col-span-5 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      )}
    </form>
  );
}
