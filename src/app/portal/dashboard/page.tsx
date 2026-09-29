"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalEquipamentos: number;
  totalLaudos: number;
  proximoVencimento: number;
  vencido: number;
  totalDocumentos: number;
}

interface DashboardData {
  stats: DashboardStats;
  alertas: string[];
}

export default function PortalDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/portal/dashboard", { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) {
            router.replace("/portal/login");
            return;
          }
          throw new Error("Erro ao carregar dashboard");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;
  const alertas = data.alertas;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Olá, Petrobras 👋
            </h1>
            <p className="text-sm text-slate-500">Seu portal EngeServ</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => router.replace("/portal/login")}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h4 className="text-slate-600 mb-3">Equipamentos</h4>
            <p className="text-2xl font-bold text-navy">{stats.totalEquipamentos}</p>
            <p className="text-sm text-slate-500">Total cadastrados</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h4 className="text-slate-600 mb-3">Laudos Vigentes</h4>
            <p className="text-2xl font-bold text-emerald-600">{stats.totalLaudos}</p>
            <p className="text-sm text-slate-500">Disponíveis</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800">
            <h4 className="text-slate-600 mb-3">Próximos Vencimentos</h4>
            <p className="text-2xl font-bold text-amber-600">{stats.proximoVencimento}</p>
            <p className="text-sm text-slate-500">Dias restantes</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-slate-600 mb-3">Alertas</h3>
          <div className="p-4 rounded bg-slate-50 dark:bg-gray-800/50">
            {alertas.map((alerta, i) => (
              <p key={i} className="text-slate-700 mb-2">{alerta}</p>
            ))}
            {alertas.length === 0 && (
              <p className="text-slate-500">Todos os equipamentos estão em dia com as inspeções.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}