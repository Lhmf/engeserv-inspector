"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavigation } from "@/components/portal/PortalNavigation";
import { StatusBadge } from "@/components/portal/StatusBadge";

interface EquipamentoPortal {
  id: string;
  tag: string;
  type: string;
  description: string | null;
  manufacturer: string | null;
  manufactureYear: number | null;
  site: string | null;
  siteId: string | null;
  status: string;
  diasRestantes: number | null;
  venceEm: string | null;
  lastInspectionAt: string | null;
}

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function EquipamentosPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [equipamentos, setEquipamentos] = useState<EquipamentoPortal[]>([]);
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

      const resp = await fetch("/api/portal/equipamentos", { credentials: "include" });
      if (!resp.ok) {
        console.error("Erro ao carregar equipamentos");
        return;
      }
      const data = await resp.json();
      setEquipamentos(data.equipamentos);
      setLoading(false);
    }

    init();
  }, [router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OK":
        return "bg-emerald-50 text-emerald-700";
      case "PROXIMO":
        return "bg-amber-50 text-amber-700";
      case "VENCIDO":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "OK":
        return "Em dia";
      case "PROXIMO":
        return "Próximo do vencimento";
      case "VENCIDO":
        return "Vencido";
      default:
        return "Sem data";
    }
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
            <h1 className="text-xl font-bold text-slate-900">Meus Equipamentos</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {equipamentos.length === 0 ? (
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum equipamento cadastrado</h2>
            <p className="text-slate-500">Entre em contato com a EngeServ para cadastrar seus equipamentos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {equipamentos.map((eq) => (
              <a
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
                  {eq.site && <p>Frente: {eq.site}</p>}
                  {eq.venceEm && (
                    <p
                      className={`font-medium ${eq.status === "VENCIDO" ? "text-rose-600" : eq.status === "PROXIMO" ? "text-amber-600" : "text-emerald-600"}`}
                    >
                      Vence em: {eq.venceEm} {eq.diasRestantes !== null ? (eq.diasRestantes > 0 ? `${eq.diasRestantes} dias` : `${Math.abs(eq.diasRestantes)} dias atraso`) : ""}
                    </p>
                  )}
                  {eq.lastInspectionAt && !eq.venceEm && (
                    <p>Última inspeção: {eq.lastInspectionAt}</p>
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