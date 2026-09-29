"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalSession } from "@/portal/lib/portal-auth";

interface FrentePortal {
  id: string;
  name: string;
  address: string | null;
  equipmentsCount: number;
  equipments: Array<{ id: string; tag: string }>;
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
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const session = await getPortalSession();
      setSession(session);

      if (!session?.clientId) {
        router.replace("/portal/login");
        return;
      }

      try {
        const resp = await fetch("/portal/frentes", {
          credentials: "include",
        });
        const data = await resp.json();
        if (data.frentes) {
          setFrentes(data.frentes);
        }
      } catch (err) {
        console.error("Erro ao carregar frentes", err);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></span>
      </div>
    );
  }

  if (!session) {
    router.replace("/portal/login");
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Minhas Frentes</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {frentes.length === 0 ? (
          <div className="text-center py-16">
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhuma frente cadastrada</h2>
            <p className="text-slate-500">As unidades/frentes da sua empresa aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {frentes.map((frente) => (
              <div
                key={frente.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">{frente.name}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-navy/10 text-navy">
                    {frente.equipmentsCount} equipamento(s)
                  </span>
                </div>
                {frente.address && (
                  <p className="text-sm text-slate-500 mb-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {frente.address}
                  </p>
                )}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2">Equipamentos desta frente:</p>
                  {frente.equipments.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {frente.equipments.map((eq) => (
                        <span
                          key={eq.id}
                          className="px-2 py-1 rounded text-xs font-mono bg-slate-50 text-slate-600"
                        >
                          {eq.tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Nenhum equipamento nesta frente</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}