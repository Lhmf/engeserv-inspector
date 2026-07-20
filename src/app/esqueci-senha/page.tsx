"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        // Por segurança, não revelamos se o email existe ou não
        setSuccess("Se o email estiver cadastrado, enviaremos instruções de recuperação.");
      } else {
        setSuccess("Se o email estiver cadastrado, enviaremos instruções de recuperação.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/login" className="inline-flex items-center text-slate-500 hover:text-slate-700 mb-4">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <h1 className="text-xl font-bold text-navy">EngeServ Inspector</h1>
          <p className="mt-1 text-sm text-slate-500">Redefinir senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email da conta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              placeholder="seuemail@engeserv.com.br"
            />
          </div>

          <p className="text-xs text-slate-500">
            Enviaremos um link para redefinir sua senha (se o email estiver cadastrado).
          </p>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {success && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Lembrou a senha? <Link href="/login" className="text-brand hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </main>
  );
}