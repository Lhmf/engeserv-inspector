"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [primeiroNome, setPrimeiroNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ primeiroNome, cnpj }),
      });

      const data = await resp.json();

      if (data.success) {
        router.replace("/portal");
        router.refresh();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro ao processar login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-navy/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-navy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Portal EngeServ</h1>
          <p className="text-sm text-slate-500 mt-1">
            Acesse sua área privada de inspeções e laudos NR-13
          </p>
        </div>

        {error && (
          <div
            className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm text-center"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="primeiroNome"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Primeiro nome do cliente
            </label>
            <input
              id="primeiroNome"
              value={primeiroNome}
              onChange={(e) => setPrimeiroNome(e.target.value)}
              type="text"
              placeholder="Ex: Prando"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all"
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-slate-700 mb-1.5">
              CNPJ
            </label>
            <input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              type="text"
              placeholder="Ex: 12.345.678/0001-90 ou 12345678000190"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Entrando...
              </span>
            ) : (
              "Entrar no Portal"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Credenciais iniciais: primeiro nome da empresa + 6 primeiros dígitos do CNPJ
        </p>
      </div>
    </div>
  );
}