"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

interface FrenteDetalhe {
  id: string;
  name: string;
  address: string | null;
  clientName: string | null;
  equipments: {
    id: string;
    tag: string;
    type: string;
    description: string | null;
    manufacturer: string | null;
    manufactureYear: number | null;
    status: string;
    diasRestantes: number | null;
    venceEm: string | null;
    lastInspectionAt: string | null;
  }[];
  equipmentsCount: number;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function FrenteDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<PortalSession | null>(null);
  const [frente, setFrente] = useState<FrenteDetalhe | null>(null);
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

        const resp = await fetch(`/api/portal/frentes/${id}`, { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (resp.status === 404) {
          setError("Frente não encontrada ou acesso não autorizado.");
          setLoading(false);
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar frente.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setError(null);
        setFrente(data.frente);
      } catch (err) {
        console.error(err);
        setError("Erro inesperado ao carregar frente.");
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
        <Loading size="lg" text="Carregando frente..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !frente) {
    return (
      <div className="bg-white dark:bg-gray-800 min-h-screen">
        <PageHeader
          title="Frente de Trabalho"
          subtitle={`Olá, ${session.name}`}
          backHref="/portal/frentes"
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
            <h2 className="text-lg font-medium text-slate-900 mb-1">Frente não encontrada</h2>
            <p className="text-slate-500 mb-4">{error || "Esta frente não existe ou você não tem permissão para acessá-la."}</p>
            <Link
              href="/portal/frentes"
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para frentes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = formatDataBR;

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title={`Frente: ${frente.name}`}
        subtitle={`Olá, ${session.name}`}
        backHref="/portal/frentes"
        backLabel="Voltar para frentes"
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Informações da Frente */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Informações da Frente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Nome</label>
                <p className="text-slate-900 dark:text-white text-lg font-medium">{frente.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Endereço</label>
                <p className="text-slate-900 dark:text-white">{frente.address || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Cliente</label>
                <p className="text-slate-900 dark:text-white">{frente.clientName || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Total de Equipamentos</label>
                <p className="text-slate-900 dark:text-white text-2xl font-bold text-navy">{frente.equipmentsCount}</p>
              </div>
            </div>
          </section>

          {/* Equipamentos da Frente */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428c2.392 2.392 2.392 6.272 0 8.664M9.5 11.5c-2.392-2.392-6.272-2.392-8.664 0M15 7.5c2.392-2.392 6.272-2.392 8.664 0M7.5 15c-2.392 2.392-2.392 6.272 0 8.664M9 9c2.392 2.392 6.272 2.392 8.664 0" />
                </svg>
                Equipamentos ({frente.equipmentsCount})
              </h2>
            </div>

            {frente.equipments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428c2.392 2.392 2.392 6.272 0 8.664M9.5 11.5c-2.392-2.392-6.272-2.392-8.664 0M15 7.5c2.392-2.392 6.272-2.392 8.664 0M7.5 15c-2.392 2.392-2.392 6.272 0 8.664M9 9c2.392 2.392 6.272 2.392 8.664 0" />
                </svg>
                <p className="text-slate-500">Nenhum equipamento cadastrado nesta frente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {frente.equipments.map((eq) => (
                  <Link
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
                      {eq.venceEm && (
                        <p
                          className={`font-medium ${eq.status === "VENCIDO" ? "text-rose-600" : eq.status === "PROXIMO" ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          Vence em: {formatDate(eq.venceEm)} {eq.diasRestantes !== null ? (eq.diasRestantes > 0 ? `${eq.diasRestantes} dias` : `${Math.abs(eq.diasRestantes)} dias atraso`) : ""}
                        </p>
                      )}
                      {eq.lastInspectionAt && !eq.venceEm && (
                        <p>Última inspeção: {formatDate(eq.lastInspectionAt)}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}