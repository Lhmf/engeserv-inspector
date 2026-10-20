"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

interface LaudoPortal {
  id: string;
  reportNumber: string;
  version: number;
  status: string;
  equipmentTag: string;
  equipmentType: string;
  equipmentId: string | null;
  inspectionDate: string;
  issuedAt: string | null;
  expiresAt: string | null;
  vigente: boolean;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

// useSearchParams exige um boundary de Suspense para o prerender estático
export default function LaudosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
          <Loading size="lg" text="Carregando laudos..." />
        </div>
      }
    >
      <LaudosContent />
    </Suspense>
  );
}

function LaudosContent() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [laudos, setLaudos] = useState<LaudoPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // A API de laudos expõe apenas estados visíveis ao cliente
  // (APPROVED/PUBLISHED) — estados internos nunca são retornados,
  // portanto não há chips para DRAFT/UNDER_REVIEW/REJECTED/ARCHIVED.
  const [filterStatus, setFilterStatus] = useState<"PUBLISHED" | "APPROVED" | "all">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get vigente from URL param, default to null (no filter)
  const vigenteParam = searchParams.get('vigente');
  const filterVigente = vigenteParam === 'true' ? true : vigenteParam === 'false' ? false : null;

  /**
   * Aplica/remove o filtro de vigência via querystring (?vigente=true|false),
   * mesmo parâmetro usado pelo Dashboard (KPI "Laudos Vigentes").
   * Clicar em um chip ativo limpa o filtro.
   */
  const aplicarFiltroVigente = (valor: "true" | "false") => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchParams.get("vigente") === valor) {
      params.delete("vigente");
    } else {
      params.set("vigente", valor);
    }
    const qs = params.toString();
    router.push(qs ? `/portal/laudos?${qs}` : "/portal/laudos", { scroll: false });
  };

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
        const resp = await fetch("/api/portal/laudos", { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar laudos. Tente novamente mais tarde.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setLaudos(data.laudos || []);
        setError(null); // Clear error on success
        setLoading(false);
      } catch (err) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
        setLoading(false);
      }
    }

    init();
  }, [router, searchParams]); // Added searchParams to re-run when vigente param changes

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
        <Loading size="lg" text="Carregando laudos..." />
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
  const filteredLaudos = laudos
    .filter(laudo => filterStatus === "all" || laudo.status === filterStatus)
    .filter(laudo => filterVigente === null || laudo.vigente === filterVigente)
    .filter(
      laudo =>
        searchTerm === "" ||
        laudo.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laudo.equipmentTag.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Laudos Técnicos"
        subtitle={`Olá, ${session.name} — laudos liberados para o portal, com validade e status`}
      />      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "all" ? "bg-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterStatus("PUBLISHED")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "PUBLISHED" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  Publicado
                </button>
                <button
                  onClick={() => setFilterStatus("APPROVED")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "APPROVED" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"}`}
                >
                  Aprovado
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Validade</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => aplicarFiltroVigente("true")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterVigente === true ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  Vigentes
                </button>
                <button
                  onClick={() => aplicarFiltroVigente("false")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterVigente === false ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  Não vigentes
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="search-laudo" className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pesquisar</label>
              <input
                id="search-laudo"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o número do laudo ou tag do equipamento"
                className="px-3 py-1.5 rounded border border-slate-200 focus:border-navy focus:ring-navy/20 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {filteredLaudos.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum laudo encontrado</h2>
              <p className="text-slate-500">Nenhum laudo corresponde aos filtros selecionados.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLaudos.map((laudo) => (
              <a
                key={laudo.id}
                href={`/portal/laudos/${laudo.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-navy">{laudo.reportNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {laudo.equipmentTag}
                    </span>
                  </div>
                  <StatusBadge status={laudo.vigente ? "OK" : laudo.expiresAt ? "VENCIDO" : "SEM_DATA"} />
                </div>
                {laudo.equipmentType && (
                  <p className="text-sm text-slate-600 mb-2">{laudo.equipmentType}</p>
                )}
                <div className="space-y-1 text-xs text-slate-500">
                  <p>Inspeção: {formatDataBR(laudo.inspectionDate)}</p>
                  {laudo.issuedAt && <p>Emissão: {formatDataBR(laudo.issuedAt)}</p>}
                  {laudo.expiresAt ? (
                    <p>Validade: {formatDataBR(laudo.expiresAt)}</p>
                  ) : (
                    <p>Validade: sem data definida</p>
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