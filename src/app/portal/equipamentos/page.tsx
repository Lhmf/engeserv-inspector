"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

interface EquipamentoPortal {
  id: string;
  tag: string;
  type: string;
  description: string | null;
  manufacturer: string | null;
  manufactureYear: number | null;
  site: string | null;
  siteId: string | null;
  status: string;
  diasRestantes: number | null;
  venceEm: string | null;
  lastInspectionAt: string | null;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

// useSearchParams exige um boundary de Suspense para o prerender estático
export default function EquipamentosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
        </div>
      }
    >
      <EquipamentosContent />
    </Suspense>
  );
}

function EquipamentosContent() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [equipamentos, setEquipamentos] = useState<EquipamentoPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTag, setSearchTag] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filterStatus from URL param, default to "all"
  const paramFilterStatus = searchParams.get('filterStatus');
  const initialFilterStatus = 
    (paramFilterStatus === "OK" || paramFilterStatus === "PROXIMO" || 
     paramFilterStatus === "VENCIDO" || paramFilterStatus === "SEM_DATA" || 
     paramFilterStatus === "all") ? paramFilterStatus : "all";
  const [filterStatus, setFilterStatus] = useState<"OK" | "PROXIMO" | "VENCIDO" | "SEM_DATA" | "all">(initialFilterStatus);

  // Update URL when filterStatus changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filterStatus === "all") {
      params.delete('filterStatus');
    } else {
      params.set('filterStatus', filterStatus);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [filterStatus, router, searchParams]);

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
        const resp = await fetch("/api/portal/equipamentos", { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar equipamentos. Tente novamente mais tarde.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setEquipamentos(data.equipamentos || []);
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
        <Loading size="lg" text="Carregando equipamentos..." />
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

  // Filter and search
  const filteredEquipamentos = equipamentos
    .filter(eq => filterStatus === "all" || eq.status === filterStatus)
    .filter(eq => searchTag === "" || eq.tag.toLowerCase().includes(searchTag.toLowerCase()));

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Meus Equipamentos"
        subtitle={`Olá, ${session.name} — filtre por status de validade ou pesquise pela tag`}
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "all" ? "bg-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus("OK")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "OK" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  Regular
                </button>
                <button
                  onClick={() => setFilterStatus("PROXIMO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "PROXIMO" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"}`}
                >
                  Atenção
                </button>
                <button
                  onClick={() => setFilterStatus("VENCIDO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "VENCIDO" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"}`}
                >
                  Vencido
                </button>
                <button
                  onClick={() => setFilterStatus("SEM_DATA")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "SEM_DATA" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  Sem data
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="search-tag" className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pesquisar por tag</label>
              <input
                id="search-tag"
                type="text"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                placeholder="Digite a tag do equipamento"
                className="px-3 py-1.5 rounded border border-slate-200 focus:border-navy focus:ring-navy/20 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {filteredEquipamentos.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 012 2H5a2 2 0 012-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum equipamento encontrado</h2>
              <p className="text-slate-500">Nenhum equipamento corresponde aos filtros selecionados.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEquipamentos.map((eq) => (
              <a
                key={eq.id}
                href={`/portal/equipamentos/${eq.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-mono font-semibold text-navy">{eq.tag}</span>
                  <StatusBadge status={eq.status} />
                </div>
                <p className="text-sm text-slate-600 mb-2">{eq.type || "—"}</p>
                {eq.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{eq.description}</p>
                )}
                <div className="space-y-1 text-xs text-slate-500">
                  {eq.manufacturer && <p>Fabricante: {eq.manufacturer}</p>}
                  {eq.site && <p>Frente: {eq.site}</p>}
                  {eq.venceEm && (
                    <p
                      className={`font-medium ${eq.status === "VENCIDO" ? "text-rose-600" : eq.status === "PROXIMO" ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      Vence em: {formatDataBR(eq.venceEm)} {eq.diasRestantes !== null ? (eq.diasRestantes > 0 ? `${eq.diasRestantes} dias` : `${Math.abs(eq.diasRestantes)} dias atraso`) : ""}
                    </p>
                  )}
                  {eq.lastInspectionAt && !eq.venceEm && (
                    <p>Última inspeção: {formatDataBR(eq.lastInspectionAt)}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}