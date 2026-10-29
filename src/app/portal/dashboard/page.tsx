"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  formatDataBR,
  EmptyState,
  EmptyStateIcons,
  KPICard,
  Loading,
  PageHeader,
} from "@/components/portal/ui";

interface PortalStats {
  totalEquipamentos: number;
  totalLaudos: number;
  proximoVencimento: number;
  vencido: number;
  regulares: number;
  semData: number;
  totalDocumentos: number;
}

interface Equipamento {
  id: string;
  tag: string;
  type: string;
  description: string | null;
  manufacturer: string | null;
  manufactureYear: number | null;
  site: string | null;
  siteId: string | null;
  status: "OK" | "PROXIMO" | "VENCIDO" | "SEM_DATA";
  diasRestantes: number | null;
  venceEm: string | null;
  lastInspectionAt: string | null;
}

interface Laudo {
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

interface Documento {
  id: string;
  type: string;
  originalName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  site: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

interface Alerta {
  tipo: "vencido" | "proximo" | "ok";
  mensagem: string;
}

/**
 * Normaliza os alertas do backend, que podem vir como string[]
 * (contrato atual de /api/portal/dashboard) ou como objetos { tipo, mensagem }.
 * Infere o tipo pela mensagem para manter a cor correta do card.
 */
function normalizarAlertas(raw: unknown): Alerta[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): Alerta | null => {
      if (typeof item === "string") {
        if (!item.trim()) return null;
        if (/vencid/i.test(item)) return { tipo: "vencido", mensagem: item };
        if (/pr[óo]xim/i.test(item)) return { tipo: "proximo", mensagem: item };
        return { tipo: "ok", mensagem: item };
      }
      if (item && typeof item === "object") {
        const alerta = item as Partial<Alerta> & Record<string, unknown>;
        const mensagem = typeof alerta.mensagem === "string" ? alerta.mensagem : null;
        if (!mensagem?.trim()) return null;
        if (alerta.tipo === "vencido" || alerta.tipo === "proximo" || alerta.tipo === "ok") {
          return { tipo: alerta.tipo, mensagem };
        }
        if (/vencid/i.test(mensagem)) return { tipo: "vencido", mensagem };
        if (/pr[óo]xim/i.test(mensagem)) return { tipo: "proximo", mensagem };
        return { tipo: "ok", mensagem };
      }
      return null;
    })
    .filter((alerta): alerta is Alerta => alerta !== null);
}

export default function PortalDashboardPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
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

        // Após validar a sessão, buscar todos os dados protegidos em paralelo
        const [dashboardResp, equipamentosResp, laudosResp, documentosResp] = await Promise.all([
          fetch("/api/portal/dashboard", { credentials: "include" }),
          fetch("/api/portal/equipamentos", { credentials: "include" }),
          fetch("/api/portal/laudos", { credentials: "include" }),
          fetch("/api/portal/documentos", { credentials: "include" }),
        ]);

        // Sessão expirada em qualquer endpoint protegido → login
        if (
          [dashboardResp, equipamentosResp, laudosResp, documentosResp].some(
            (resp) => resp.status === 401
          )
        ) {
          router.replace("/portal/login");
          return;
        }

        let failed = false;
        if (dashboardResp.ok) {
          const data = await dashboardResp.json();
          setStats(data.stats || null);
          setAlertas(normalizarAlertas(data.alertas));
        } else {
          failed = true;
        }
        if (equipamentosResp.ok) {
          const data = await equipamentosResp.json();
          setEquipamentos(data.equipamentos || []);
        } else {
          failed = true;
        }
        if (laudosResp.ok) {
          const data = await laudosResp.json();
          setLaudos(data.laudos || []);
        } else {
          failed = true;
        }
        if (documentosResp.ok) {
          const data = await documentosResp.json();
          setDocumentos(data.documentos || []);
        } else {
          failed = true;
        }

        if (failed) {
          setError("Não foi possível carregar todos os dados do dashboard. Tente novamente.");
        }
      } catch (err) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, reloadKey]);

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
        <Loading size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Dashboard"
        subtitle={`Olá, ${session.name} — visão geral das inspeções NR-13 dos seus equipamentos`}
      />

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#12345b] to-[#176b82] p-6 text-white shadow-lg md:p-8">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">EngeServ Inspector</p>
            <h2 className="text-2xl font-bold md:text-3xl">Seu controle NR-13 em um só lugar</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Acompanhe a validade dos equipamentos, consulte laudos e encontre rapidamente o que precisa de atenção.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/portal/equipamentos" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a1628] transition hover:bg-cyan-50">Ver equipamentos</Link>
              <Link href="/portal/laudos" className="inline-flex min-h-11 items-center rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Consultar laudos</Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border-[32px] border-cyan-200/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full border-[24px] border-white/10" aria-hidden="true" />
        </section>
        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300" role="alert">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
        {alertas.length > 0 && (
          <div className="mb-6 space-y-2">
            {alertas.map((alerta, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alerta.tipo === "vencido"
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : alerta.tipo === "proximo"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
                role="alert"
              >
                <div className="flex items-center gap-2">
                  {alerta.tipo === "vencido" && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 100-2V6a1 1 0 100-2V6a1 1 0 100-2V6a1 1 0 100-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alerta.tipo === "proximo" && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 100-2v-3a1 1 0 100-2z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alerta.tipo === "ok" && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p className="text-sm">{alerta.mensagem}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <KPICard
              label="Total Equipamentos"
              value={stats.totalEquipamentos}
              href="/portal/equipamentos"
              iconBgColor="bg-navy/10"
              iconColor="text-navy"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 012-2H5a2 2 0 012-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <KPICard
              label="Laudos Vigentes"
              value={stats.totalLaudos}
              href="/portal/laudos?vigente=true"
              iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <KPICard
              label="Próximos do Vencimento"
              value={stats.proximoVencimento}
              href="/portal/calendario"
              iconBgColor="bg-amber-100 dark:bg-amber-900/30"
              iconColor="text-amber-600"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KPICard
              label="Vencidos"
              value={stats.vencido}
              href="/portal/calendario"
              iconBgColor="bg-rose-100 dark:bg-rose-900/30"
              iconColor="text-rose-600"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                </svg>
              }
            />
            <KPICard
              label="Documentos"
              value={stats.totalDocumentos}
              href="/portal/documentos"
              iconBgColor="bg-slate-100 dark:bg-slate-800"
              iconColor="text-slate-600 dark:text-slate-400"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Situação das Inspeções */}
        {stats && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Situação das inspeções</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Regular</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.regulares}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Validade superior a 30 dias</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Atenção</p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.proximoVencimento}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Vence em até 30 dias</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-rose-200 dark:border-rose-800 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Vencido</p>
                    <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.vencido}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l2-2m-2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Laudo vencido</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sem data</p>
                    <p className="text-3xl font-bold text-slate-500 dark:text-slate-400 mt-1">{stats.semData}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Sem inspeção aprovada</p>
              </div>
            </div>
          </section>
        )}

        {/* Próximos Vencimentos */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Próximos vencimentos</h2>
            <Link
              href="/portal/equipamentos"
              className="text-sm text-navy hover:underline"
            >
              Ver equipamentos
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Equipamento</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Local</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Última inspeção</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Vence em</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {equipamentos
                    .filter((e) => e.status !== "SEM_DATA")
                    .sort((a, b) => (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999))
                    .slice(0, 10)
                    .map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <Link
                            href={`/portal/equipamentos/${eq.id}`}
                            className="font-mono hover:text-navy hover:underline"
                          >
                            {eq.tag}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{eq.type}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{eq.site || "—"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {eq.lastInspectionAt ? formatDataBR(eq.lastInspectionAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                           {eq.venceEm ? formatDataBR(eq.venceEm) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              eq.status === "VENCIDO"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                                : eq.status === "PROXIMO"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            }`}
                          >
                            {eq.status === "VENCIDO" && "Vencido"}
                            {eq.status === "PROXIMO" && "Atenção"}
                            {eq.status === "OK" && "Regular"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {equipamentos.filter((e) => e.status !== "SEM_DATA").length === 0 && (
              <EmptyState
                size="sm"
                icon={EmptyStateIcons.calendar}
                title="Nenhum vencimento no radar"
                description="Quando houver equipamentos com data de validade definida, os próximos vencimentos aparecerão aqui."
              />
            )}
          </div>
        </section>

        {/* Atividade Recente */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Atividade recente</h2>
            <div className="flex items-center gap-4">
              <Link href="/portal/laudos" className="text-sm text-navy hover:underline">Ver laudos</Link>
              <Link href="/portal/documentos" className="text-sm text-navy hover:underline">Ver documentos</Link>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {(() => {
                  const combined = [
                    ...laudos.map(laudo => ({
                      type: 'laudo' as const,
                      id: laudo.id,
                      date: laudo.issuedAt || laudo.inspectionDate,
                      data: laudo
                    })),
                    ...documentos.map(doc => ({
                      type: 'documento' as const,
                      id: doc.id,
                      date: doc.createdAt,
                      data: doc
                    }))
                  ];

                  const sorted = combined.sort((a, b) => {
                    const dateA = a.date ? new Date(a.date) : new Date(0);
                    const dateB = b.date ? new Date(b.date) : new Date(0);
                    const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
                    const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
                    return timeB - timeA;
                  });

                  return sorted.slice(0, 5);
                })().map((item, index) => (
                  item.type === 'laudo' ? (
                    <Link key={item.id} href={`/portal/laudos/${item.data.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">Laudo {item.data.reportNumber} v{item.data.version}</p>
                          <p className="text-xs text-slate-500">{item.data.equipmentTag} — {item.data.equipmentType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{formatDataBR(item.data.issuedAt || item.data.inspectionDate)}</p>
                         <span
                           className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                             item.data.vigente
                               ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                               : item.data.expiresAt
                               ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                               : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                           }`}
                         >
                           {item.data.vigente ? "Vigente" : item.data.expiresAt ? "Vencido" : "Sem data"}
                          </span>
                        </div>
                      </Link>
                    ) : (
                    <Link key={item.id} href={item.data.url} target="_blank" className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 012-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{item.data.originalName}</p>
                          <p className="text-xs text-slate-500">{item.data.type} — {item.data.site || "Sem local"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{formatDataBR(item.data.createdAt)}</p>
                      </div>
                    </Link>
                  )
                ))}
              </div>
              {laudos.length === 0 && documentos.length === 0 && (
                <EmptyState
                  size="sm"
                  icon={EmptyStateIcons.document}
                  title="Nenhuma atividade recente"
                  description="Laudos e documentos recém-liberados pela EngeServ aparecem aqui."
                />
              )}
            </div>
          </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/portal/equipamentos"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center group-hover:bg-navy/20 transition-colors">
              <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 012-2H5a2 2 0 012-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Meus Equipamentos</p>
              <p className="text-xs text-slate-500">Visualizar e gerenciar equipamentos</p>
            </div>
          </Link>

          <Link
            href="/portal/laudos"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Laudos Técnicos</p>
              <p className="text-xs text-slate-500">Acessar laudos NR-13</p>
            </div>
          </Link>

          <Link
            href="/portal/calendario"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Calendário de Validades</p>
              <p className="text-xs text-slate-500">Próximas inspeções e vencimentos</p>
            </div>
          </Link>

          <Link
            href="/portal/documentos"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Documentos</p>
              <p className="text-xs text-slate-500">ARTs, certificados e anexos</p>
            </div>
          </Link>

          <Link
            href="/portal/recomendacoes"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Recomendações</p>
              <p className="text-xs text-slate-500">Ações técnicas de inspeções e laudos</p>
            </div>
          </Link>

          <Link
            href="/portal/frentes"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Frentes de Serviço</p>
              <p className="text-xs text-slate-500">Locais e equipamentos por frente</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
