"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loading, PageHeader } from "@/components/portal/ui";

interface FrentePortal {
  id: string;
  name: string;
  address: string | null;
  equipmentsCount: number;
  equipments: { id: string; tag: string }[];
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function FrentesPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [frentes, setFrentes] = useState<FrentePortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // Clear error at the start of a new attempt
      setError(null);
      const sessionResp = await fetch("/api/portal/session", { credentials: "include" });
      if (!sessionResp.ok) {
        router.replace("/portal/login");
        return;
      }
      const sessionData = await sessionResp.json();
      if (!sessionData.session) {
        router.replace("/portal/login");
        return;
      }
      setSession(sessionData.session);

      try {
        const resp = await fetch("/api/portal/frentes", { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar frentes. Tente novamente mais tarde.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setFrentes(data.frentes || []);
        setError(null); // Clear error on success
        setLoading(false);
      } catch (err) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
        setLoading(false);
      }
    }

    init();
  }, [router]);

  // Redireciona para o login somente depois de concluído o carregamento
  // inicial sem sessão — como efeito, nunca durante o render.
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/portal/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <Loading size="lg" text="Carregando frentes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto text-slate-300 mb-4">
              <svg
                className="w-16 h-16 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-medium text-slate-900 mb-1">Erro ao carregar</h2>
              <p className="text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors mt-6 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7h18" />
                </svg>
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Search
  const filteredFrentes = frentes
    .filter(
      frente =>
        searchTerm === "" ||
        frente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (frente.address && frente.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Frentes de Trabalho"
        subtitle={`Olá, ${session.name} — frentes de serviço com equipamentos cadastrados`}
      />      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <label htmlFor="search-frente" className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pesquisar</label>
            <input
              id="search-frente"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou endereço da frente"
              className="px-3 py-1.5 rounded border border-slate-200 focus:border-navy focus:ring-navy/20 text-sm w-full"
            />
          </div>
        </div>

        {filteredFrentes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto text-slate-300 mb-4">
              <svg
                className="w-16 h-16 mx-auto text-slate-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhuma frente encontrada</h2>
              <p className="text-slate-500">Nenhuma frente corresponde ao termo de pesquisa.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFrentes.map((frente) => (
              <Link
                key={frente.id}
                href={`/portal/frentes/${frente.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-navy transition-colors">{frente.name}</h3>
                </div>
                {frente.address && (
                  <p className="text-sm text-slate-500 mb-3">{frente.address}</p>
                )}
                <div className="space-y-1 text-xs text-slate-500">
                  <p>{frente.equipmentsCount} equipamento(s)</p>
                  {frente.equipments.length > 0 && (
                    <details className="group-open:mt-2">
                      <summary className="cursor-pointer text-navy hover:underline">Ver equipamentos</summary>
                      <ul className="mt-1 ml-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {frente.equipments.map((eq) => (
                          <li key={eq.id} className="font-mono">{eq.tag}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}