"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

interface RecomendacaoPortal {
  id: string;
  equipamento: string;
  tag: string;
  tipo: string;
  recomendacao: string;
  origem: "INSPECAO" | "LAUDO";
  data: string;
  status: string;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function RecomendacoesPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [recomendacoes, setRecomendacoes] = useState<RecomendacaoPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOrigem, setFilterOrigem] = useState<"INSPECAO" | "LAUDO" | "all">("all");
  // A API expõe apenas recomendações de inspeções APROVADAS e laudos
  // APPROVED/PUBLISHED — estados internos nunca são retornados.
  const [filterStatus, setFilterStatus] = useState<"APROVADA" | "PUBLISHED" | "APPROVED" | "all">("all");
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
        const resp = await fetch("/api/portal/recomendacoes", { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar recomendações. Tente novamente mais tarde.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setRecomendacoes(data.recomendacoes || []);
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

  const getOrigemBadge = (origem: string) => {
    return origem === "LAUDO"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-blue-100 text-blue-700";
  };

  const getOrigemLabel = (origem: string) => {
    return origem === "LAUDO" ? "Laudo Técnico" : "Inspeção";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <Loading size="lg" text="Carregando recomendações..." />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
  const filteredRecomendacoes = recomendacoes
    .filter(rec => filterOrigem === "all" || rec.origem === filterOrigem)
    .filter(rec => filterStatus === "all" || rec.status === filterStatus)
    .filter(
      rec =>
        searchTerm === "" ||
        rec.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Recomendações"
        subtitle={`Olá, ${session.name} — recomendações técnicas de inspeções e laudos`}
      />      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Origem</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterOrigem("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterOrigem === "all" ? "bg-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterOrigem("INSPECAO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterOrigem === "INSPECAO" ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"}`}
                >
                  Inspeção
                </button>
                <button
                  onClick={() => setFilterOrigem("LAUDO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterOrigem === "LAUDO" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  Laudo
                </button>
              </div>
            </div>
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
                  onClick={() => setFilterStatus("APROVADA")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "APROVADA" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  Aprovada
                </button>
                <button
                  onClick={() => setFilterStatus("PUBLISHED")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatus === "PUBLISHED" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"}`}
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
              <label htmlFor="search-rec" className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pesquisar</label>
              <input
                id="search-rec"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite a tag ou tipo da recomendação"
                className="px-3 py-1.5 rounded border border-slate-200 focus:border-navy focus:ring-navy/20 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {filteredRecomendacoes.length === 0 ? (
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhuma recomendação encontrada</h2>
              <p className="text-slate-500">Nenhuma recomendação corresponde aos filtros selecionados.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecomendacoes.map((rec) => (
              <div
                key={rec.id}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold text-navy">{rec.tag}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrigemBadge(rec.origem)}`}>
                      {getOrigemLabel(rec.origem)}
                    </span>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
                <p className="text-sm text-slate-600 mb-3">{rec.tipo}</p>
                <p className="text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap">{rec.recomendacao}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{formatDataBR(rec.data)}</span>
                  <span>Equipamento: {rec.equipamento}</span>
                  {rec.origem === "LAUDO" && (
                    <Link
                      href={`/portal/laudos/${rec.id}`}
                      className="ml-auto inline-flex items-center gap-1 text-navy hover:underline"
                    >
                      Ver laudo
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
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