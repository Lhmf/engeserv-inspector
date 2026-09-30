"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavigation } from "@/components/portal/PortalNavigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import Link from "next/link";

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

      const resp = await fetch("/api/portal/laudos", { credentials: "include" });
      if (!resp.ok) {
        console.error("Erro ao carregar laudos");
        return;
      }
      const data = await resp.json();
      setLaudos(data.laudos);
      setLoading(false);
    }

    init();
  }, [router]);

  const getStatusBadge = (status: string, vigente: boolean) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-50 text-emerald-700";
      case "APPROVED":
        return "bg-blue-50 text-blue-700";
      case "DRAFT":
        return "bg-slate-50 text-slate-600";
      case "UNDER_REVIEW":
        return "bg-amber-50 text-amber-700";
      default:
        return vigente ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
    }
  };

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
            <h1 className="text-xl font-bold text-slate-900">Laudos Técnicos</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {laudos.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum laudo encontrado</h2>
            <p className="text-slate-500">Laudos técnicos NR-13 aparecerão aqui após aprovação.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {laudos.map((laudo) => (
              <a
                key={laudo.id}
                href={`/portal/laudos/${laudo.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-mono font-semibold text-navy">{laudo.reportNumber}</span>
                  <StatusBadge status={laudo.vigente ? "OK" : "VENCIDO"} />
                </div>
                <p className="text-sm text-slate-600 mb-2">{laudo.equipmentTag} — {laudo.equipmentType}</p>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>Inspeção: {laudo.inspectionDate}</p>
                  {laudo.issuedAt && <p>Emitido: {laudo.issuedAt}</p>}
                  {laudo.expiresAt && (
                    <p className={`font-medium ${laudo.vigente ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Validade até: {laudo.expiresAt} {laudo.vigente ? '✓ Vigente' : '✗ Expirado'}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(laudo.status, laudo.vigente)}`}>
                    {getStatusLabel(laudo.status)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}