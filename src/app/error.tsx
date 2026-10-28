"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[APP_RUNTIME_ERROR]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Não foi possível carregar esta tela</h1>
        <p className="mt-2 text-sm text-slate-600">Ocorreu uma falha temporária. Tente novamente.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white">
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
