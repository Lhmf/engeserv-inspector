"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavigation } from "@/components/portal/PortalNavigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import Link from "next/link";

interface PortalStats {
  totalEquipamentos: number;
  totalLaudos: number;
  proximoVencimento: number;
  vencido: number;
  totalDocumentos: number;
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

export default function PortalDashboardPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
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

      const statsResp = await fetch("/api/portal/dashboard", { credentials: "include" });
      if (statsResp.ok) {
        const data = await statsResp.json();
        setStats(data.stats);
        setAlertas(data.alertas);
      }
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
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">Olá, {session.name} — Portal do Cliente EngeServ</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Alertas */}
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
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alerta.tipo === "proximo" && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  {alerta.tipo === "ok" && (
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Equipamentos</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalEquipamentos}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-navy/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Laudos Vigentes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalLaudos}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Próximos do Vencimento</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.proximoVencimento}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vencidos</p>
                  <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.vencido}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Documentos</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalDocumentos}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/portal/equipamentos"
            className="group flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white dark:bg-gray-800 dark:border-slate-700 hover:border-navy/30 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center group-hover:bg-navy/20 transition-colors">
              <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-navy transition-colors">Documentos</p>
              <p className="text-xs text-slate-500">ARTs, certificados e anexos</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}