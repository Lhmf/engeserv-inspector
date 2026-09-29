"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalSession } from "@/portal/lib/portal-auth";

export default function LaudosPage() {
  const [session, setSession] = useState<any>(null);
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
        const resp = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/reports/list?clientId=${session.clientId}`,
          {
            credentials: "include",
          }
        );
        const data = await resp.json();
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar laudos", err);
      }

      setLoading(false);
    }

    init();
  }, [router]);

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
    <div className="bg-white dark:bg-gray-800 p-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Laudos</h1>
      <p className="text-sm text-slate-500 mb-4">
        Olá, {session.name}
      </p>
      <p className="text-slate-500">
        Seus laudos NR-13
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder cards */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800 min-h-[200px]">
          <div className="text-sm text-slate-500">
            <strong>Nenhum laudo encontrado.</strong>
            <p className="mt-1">Use o filtro para visualizar laudos vigentes, próximos do vencimento ou vencidos.</p>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800 min-h-[200px]">
          <div className="text-sm text-slate-500">
            Laudo V-101
          </div>
          <div className="text-xs text-slate-400">NR-13</div>
          <div className="text-right">Validade: 12/08/2027</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-800 min-h-[200px]">
          <div className="text-sm text-slate-500">
            Laudo V-205
          </div>
          <div className="text-xs text-slate-400">NR-13</div>
          <div className="text-right">Validade: 04/02/2027</div>
        </div>
      </div>
    </div>
  );
}