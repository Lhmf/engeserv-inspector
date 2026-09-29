"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalSession } from "@/portal/lib/portal-auth";

interface LaudoPortal {
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

interface PortalSession {
  clientId: string;
  name: string;
  role: "CLIENTE";
}

export default function LaudosPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [laudos, setLaudos] = useState<LaudoPortal[]>([]);
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
        const resp = await fetch("/portal/laudos", {
          credentials: "include",
        });
        const data = await resp.json();
        if (data.laudos) {
          setLaudos(data.laudos);
        }
      } catch (err) {
        console.error("Erro ao carregar laudos", err);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  const getStatusBadge = (status: string, vigente: boolean) => {
    if (!vigente) return "bg-rose-50 text-rose-700";
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-50 text-emerald-700";
      case "APPROVED":
        return "bg-blue-50 text-blue-700";
      case "UNDER_REVIEW":
        return "bg-amber-50 text-amber-700";
      case "DRAFT":
        return "bg-slate-50 text-slate-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "Publicado";
      case "APPROVED":
        return "Aprovado";
      case "UNDER_REVIEW":
        return "Em revisão";
      case "DRAFT":
        return "Rascunho";
      case "REJECTED":
        return "Rejeitado";
      case "ARCHIVED":
        return "Arquivado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-800">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></span>
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
            <h1 className="text-xl font-bold text-slate-900">Laudos NR-13</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {laudos.length === 0 ? (
          <div className="text-center py-16">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum laudo encontrado</h2>
            <p className="text-slate-500">Os laudos NR-13 das suas inspeções aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {laudos.map((laudo) => (
              <div
                key={laudo.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-mono font-semibold text-navy">{laudo.reportNumber} v{laudo.version}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(laudo.status, laudo.vigente)}`}>
                    {laudo.vigente ? getStatusLabel(laudo.status) : "Vencido"}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{laudo.equipmentTag} — {laudo.equipmentType}</p>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>Inspeção: {laudo.inspectionDate}</p>
                  {laudo.issuedAt && <p>Emissão: {laudo.issuedAt}</p>}
                  {laudo.expiresAt && (
                    <p className={`font-medium ${laudo.vigente ? "text-emerald-600" : "text-rose-600"}`}>
                      Validade: {laudo.expiresAt} {laudo.vigente ? "(Vigente)" : "(Vencido)"}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <a
                    href={`/api/reports/${laudo.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center text-sm text-navy hover:text-navy/80 font-medium"
                  >
                    Visualizar PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}