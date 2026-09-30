"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavigation } from "@/components/portal/PortalNavigation";
import { StatusBadge } from "@/components/portal/StatusBadge";

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

      const resp = await fetch("/api/portal/recomendacoes", { credentials: "include" });
      if (!resp.ok) {
        console.error("Erro ao carregar recomendações");
        return;
      }
      const data = await resp.json();
      setRecomendacoes(data.recomendacoes);
      setLoading(false);
    }

    init();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APROVADA":
        return "bg-emerald-50 text-emerald-700";
      case "PUBLISHED":
      case "APPROVED":
        return "bg-blue-50 text-blue-700";
      case "EM_ANDAMENTO":
        return "bg-slate-50 text-slate-600";
      case "AGUARDANDO_APROVACAO":
        return "bg-amber-50 text-amber-700";
      case "REJEITADA":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

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
            <h1 className="text-xl font-bold text-slate-900">Recomendações</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {recomendacoes.length === 0 ? (
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhuma recomendação encontrada</h2>
            <p className="text-slate-500">Recomendações de inspeções e laudos aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recomendacoes.map((rec) => (
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
                  <StatusBadge status={rec.status === "APROVADA" ? "OK" : rec.status === "PUBLISHED" || rec.status === "APPROVED" ? "OK" : rec.status} />
                </div>
                <p className="text-sm text-slate-600 mb-3">{rec.tipo}</p>
                <p className="text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap">{rec.recomendacao}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>{rec.data}</span>
                  <span>Equipamento: {rec.equipamento}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}