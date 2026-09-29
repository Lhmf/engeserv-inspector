"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalSession } from "@/portal/lib/portal-auth";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
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
        // Fetch consolidated KPI data from portal dashboard API
        const dashboardResp = await fetch(
          "/portal/dashboard",
          {
            credentials: "include",
          }
        );
        const dashboardData = await dashboardResp.json();
        // Expect dashboardData to contain the same shape as previously setKpis
        setKpis(dashboardData);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard", err);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></span>
      </div>
    );
  }

  if (!session) {
    router.replace("/portal/login");
    return null;
  }

  const stats = kpis?.stats || { totalEquipamentos: 0, totalLaudos: 0, proximoVencimento: 0, vencido: 0 };
  const validades = kpis?.validades || [];
  const equipamentos = kpis?.equipamentos || [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Olá, {session.name} 👋
            </h1>
            <p className="text-sm text-slate-500">
              Seu portal EngeServ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="relative p-2 rounded-full hover:bg-slate-50"
              aria-label="Notificações"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-slate-400"
                viewBox="0 0 20 20"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v6a2 2 0 002 2h5m-1.414-9.414a2 2 0 112.828 2.828L11 8l1.414-1.414a2 2 0 000-2.828z"
                />
                <path
                  fill="currentColor"
                  d="M19.5 13.5l-3 3m0-3l-3-3m3 3H13l2.5 2.5"
                />
              </svg>
              <span
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-slate-300"
              />
            </button>
            <button
              onClick={() => router.replace("/portal/login")}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* KPI: Equipamentos */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h4 className="card-title mb-3 text-slate-600">Equipamentos</h4>
            <p className="text-2xl font-bold text-navy">{stats.totalEquipamentos}</p>
            <p className="text-sm text-slate-500">Total cadastrados</p>
          </div>

          {/* KPI: Laudos Vigentes */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h4 className="card-title mb-3 text-slate-600">Laudos Vigentes</h4>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalLaudos}</p>
            <p className="text-sm text-slate-500">Disponíveis</p>
          </div>

          {/* KPI: Próximos Vencimentos */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h4 className="card-title mb-3 text-slate-600">Próximos Vencimentos</h4>
            <p className="text-2xl font-bold text-amber-600">{stats.proximoVencimento}</p>
            <p className="text-sm text-slate-500">Dias restantes</p>
          </div>
        </div>

        {/* Área de alertas */}
        <div className="mt-6">
          <h3 className="text-slate-600 mb-3">Alertas</h3>
          <div className="p-4 rounded bg-slate-50 dark:bg-gray-800/50">
            {stats.vencido > 0 && (
              <p className="text-slate-700 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 text-rose-500"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9l2 2 4-4m6 2a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0 014-4h8a4 4 0 014 4z"
                  />
                </svg>
                {stats.vencido} equipamento(s) com laudo vencido
              </p>
            )}
            {stats.proximoVencimento > 0 && (
              <p className="text-slate-700 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 text-amber-500"
                  viewBox="0 0 20 20"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    fill="currentColor"
                    d="M9.09 9a3 3 0 015.91 0l.48.48a3 3 0 01-.49 5.49l-1.98-1.98a3 3 0 010-4.4z"
                  />
                </svg>
                {stats.proximoVencimento} equipamento(s) com laudo próximo do vencimento
              </p>
            )}
            {!stats.vencido && !stats.proximoVencimento && (
              <p className="text-slate-500">
                Todos os equipamentos estão em dia com as inspeções.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}