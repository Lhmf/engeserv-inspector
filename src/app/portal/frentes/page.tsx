"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavigation } from "@/components/portal/PortalNavigation";
import Link from "next/link";

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
  const router = useRouter();

  useEffect(() => {
    async function init() {
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

      const resp = await fetch("/api/portal/frentes", { credentials: "include" });
      if (!resp.ok) {
        console.error("Erro ao carregar frentes");
        return;
      }
      const data = await resp.json();
      setFrentes(data.frentes);
      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
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
            <h1 className="text-xl font-bold text-slate-900">Frentes de Trabalho</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {frentes.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhuma frente cadastrada</h2>
            <p className="text-slate-500">Frentes de trabalho aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {frentes.map((frente) => (
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