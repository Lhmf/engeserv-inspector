"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

interface LaudoDetalhe {
  id: string;
  reportNumber: string;
  version: number;
  status: string;
  inspectionDate: string;
  issuedAt: string | null;
  expiresAt: string | null;
  vigente: boolean;
  recommendations: string | null;
  equipment: {
    id: string;
    tag: string;
    type: string;
    clientName: string | null;
    site: string | null;
  } | null;
  site: string | null;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function LaudoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<PortalSession | null>(null);
  const [laudo, setLaudo] = useState<LaudoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
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
        // Clear error at start of new attempt
        setError(null);

        const resp = await fetch(`/api/portal/laudos/${id}`, { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (resp.status === 404) {
          setError("Laudo não encontrado ou acesso não autorizado.");
          setLoading(false);
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar laudo.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setError(null);
        setLaudo(data.laudo);
      } catch (err) {
        console.error(err);
        setError("Erro inesperado ao carregar laudo.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [id, router]);

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
        <Loading size="lg" text="Carregando laudo..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !laudo) {
    return (
      <div className="bg-white dark:bg-gray-800 min-h-screen">
        <PageHeader
          title="Laudo Técnico"
          subtitle={`Olá, ${session.name}`}
          backHref="/portal/laudos"
        />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Laudo não encontrado</h2>
            <p className="text-slate-500 mb-4">{error || "Este laudo não existe ou você não tem permissão para acessá-lo."}</p>
            <Link
              href="/portal/laudos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para laudos
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Publicado";
      case "APPROVED":
        return "Aprovado";
      case "DRAFT":
        return "Rascunho";
      case "UNDER_REVIEW":
        return "Em Revisão";
      case "REJECTED":
        return "Rejeitado";
      case "ARCHIVED":
        return "Arquivado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string, vigente: boolean) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-50 text-emerald-700";
      case "APPROVED":
        return "bg-blue-50 text-blue-700";
      case "DRAFT":
        return "bg-slate-50 text-slate-600";
      case "UNDER_REVIEW":
        return "bg-amber-50 text-amber-700";
      case "REJECTED":
        return "bg-rose-50 text-rose-700";
      case "ARCHIVED":
        return "bg-gray-50 text-gray-600";
      default:
        return vigente ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title={`Laudo: ${laudo.reportNumber}`}
        subtitle={`Olá, ${session.name} — versão ${laudo.version}`}
        backHref="/portal/laudos"
        backLabel="Voltar para laudos"
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Cabeçalho do Laudo */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-mono font-semibold text-navy">{laudo.reportNumber}</span>
                  <StatusBadge status={laudo.vigente ? "OK" : laudo.expiresAt ? "VENCIDO" : "SEM_DATA"} />
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <span>Versão: {laudo.version}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(laudo.status, laudo.vigente)}`}>
                    {getStatusLabel(laudo.status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Data da Inspeção</label>
                <p className="text-slate-900 dark:text-white font-medium">{formatDataBR(laudo.inspectionDate)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Data de Emissão</label>
                <p className="text-slate-900 dark:text-white">{formatDataBR(laudo.issuedAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Validade até</label>
                <p
                  className={`font-medium ${
                    laudo.expiresAt
                      ? laudo.vigente
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {laudo.expiresAt
                    ? `${formatDataBR(laudo.expiresAt)} ${laudo.vigente ? "✓ Vigente" : "✗ Expirado"}`
                    : "Sem validade definida"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Frente</label>
                <p className="text-slate-900 dark:text-white">{laudo.site || "—"}</p>
              </div>
            </div>
          </section>

          {/* Equipamento */}
          {laudo.equipment && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428c2.392 2.392 2.392 6.272 0 8.664M9.5 11.5c-2.392-2.392-6.272-2.392-8.664 0M15 7.5c2.392-2.392 6.272-2.392 8.664 0M7.5 15c-2.392 2.392-2.392 6.272 0 8.664M9 9c2.392 2.392 6.272 2.392 8.664 0" />
                </svg>
                Equipamento Inspecionado
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tag</label>
                  <p className="text-slate-900 dark:text-white font-mono text-lg">{laudo.equipment.tag}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tipo</label>
                  <p className="text-slate-900 dark:text-white">{laudo.equipment.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Cliente</label>
                  <p className="text-slate-900 dark:text-white">{laudo.equipment.clientName || "—"}</p>
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Frente</label>
                  <p className="text-slate-900 dark:text-white">{laudo.equipment.site || "—"}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/portal/equipamentos/${laudo.equipment.id}`}
                  className="inline-flex items-center gap-2 text-sm text-navy hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Ver detalhes do equipamento
                </Link>
              </div>
            </section>
          )}

          {/* Recomendações */}
          {laudo.recommendations && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recomendações
              </h2>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-slate-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-slate-100 whitespace-pre-wrap">
                {laudo.recommendations}
              </div>
            </section>
          )}

          {(!laudo.recommendations && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Recomendações
              </h2>
              <p className="text-slate-500 text-center py-8">Nenhuma recomendação registrada neste laudo.</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}