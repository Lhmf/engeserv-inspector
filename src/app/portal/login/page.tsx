"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/portal/ui/Button";
import { Input } from "@/components/portal/ui/Input";

export default function PortalLoginPage() {
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
        setError(data.error ?? "Credenciais inválidas");
      }
    } catch (err) {
      setError("Erro ao processar login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo header */}
        <div className="text-center mb-10">
          <Link href="/portal" className="inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-navy/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Portal EngeServ</h1>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-2">Portal do Cliente — Gestão NR-13</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300" role="alert">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              id="primeiroNome"
              label="Usuário"
              type="text"
              placeholder="Primeiro nome da empresa"
              value={primeiroNome}
              onChange={(e) => setPrimeiroNome(e.target.value)}
              required
              autoComplete="username"
              autoFocus
            />

            <Input
              id="cnpj"
              label="Senha"
              type="password"
              placeholder="CNPJ (ou 6 dígitos)"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Credenciais iniciais: primeiro nome da empresa + 6 primeiros dígitos do CNPJ
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          EngeServ Inspector — Engenharia + Confiabilidade + Tecnologia
        </p>
      </div>
    </div>
  );
}