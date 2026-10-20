"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";
import Link from "next/link";

interface ValidadeItem {
  equipmentId: string;
  equipmentTag: string;
  equipmentType: string;
  clientId: string;
  clientName: string;
  lastApprovedAt: string | null;
  periodicityMonths: number | null;
  nextDueDate: string | null;
  status: "VENCIDO" | "PROXIMO" | "OK" | "SEM_DATA";
}

interface Stats {
  total: number;
  vencido: number;
  proximo: number;
  ok: number;
  semData: number;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function CalendarioPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [validades, setValidades] = useState<ValidadeItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "VENCIDO" | "PROXIMO" | "OK" | "SEM_DATA">("all");
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
        const resp = await fetch("/api/portal/calendario", { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar calendário. Tente novamente mais tarde.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setValidades(data.validades || []);
        setStats(data.stats || null);
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

  const filteredValidades = validades.filter((v) => filter === "all" || v.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <Loading size="lg" text="Carregando calendário..." />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Calendário de Validades"
        subtitle={`Olá, ${session.name} — próximas inspeções NR-13 por equipamento`}
      />      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Stats Bar */}
        {stats && (
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter("VENCIDO")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "VENCIDO" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"}`}
            >
              Vencidos ({stats.vencido})
            </button>
            <button
              onClick={() => setFilter("PROXIMO")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "PROXIMO" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"}`}
            >
              Próximos ({stats.proximo})
            </button>
            <button
              onClick={() => setFilter("OK")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "OK" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
            >
              Em dia ({stats.ok})
            </button>
            <button
              onClick={() => setFilter("SEM_DATA")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "SEM_DATA" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}
            >
              Sem data ({stats.semData})
            </button>
          </div>
        )}

        {filteredValidades.length === 0 ? (
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum equipamento encontrado</h2>
            <p className="text-slate-500">Equipamentos com datas de validade aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredValidades.map((v) => (
              <Link href={`/portal/equipamentos/${v.equipmentId}`} key={v.equipmentId} className="block">
                <div className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800">
                  <div className="w-12 h-12 rounded-lg bg-navy/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-navy">{v.equipmentTag}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{v.equipmentType}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {v.lastApprovedAt && <span>Última inspeção: {formatDataBR(v.lastApprovedAt)}</span>}
                      {v.nextDueDate && (
                        <span className={`font-medium ${v.status === "VENCIDO" ? "text-rose-600" : v.status === "PROXIMO" ? "text-amber-600" : "text-emerald-600"}`}>
                          Vence: {formatDataBR(v.nextDueDate)}
                        </span>
                      )}
                      {!v.nextDueDate && <span className="text-slate-400">Sem data de validade definida</span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}