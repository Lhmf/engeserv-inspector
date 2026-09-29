"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPortalSession } from "@/portal/lib/portal-auth";

interface DocumentoPortal {
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

const getTypeBadge = (type: string) => {
  switch (type) {
    case "LAUDO":
      return "bg-blue-50 text-blue-700";
    case "ART":
      return "bg-emerald-50 text-emerald-700";
    case "INSPECAO":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-50 text-slate-700";
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export default function DocumentosPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoPortal[]>([]);
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
        const resp = await fetch("/portal/documentos", {
          credentials: "include",
        });
        const data = await resp.json();
        if (data.documentos) {
          setDocumentos(data.documentos);
        }
      } catch (err) {
        console.error("Erro ao carregar documentos", err);
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
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Documentos</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-6">
          <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            Prontuários
          </button>
          <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            Laudos NR-13
          </button>
          <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            ARTs
          </button>
          <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            Inspeções
          </button>
          <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50">
            Outros
          </button>
        </div>

        {documentos.length === 0 ? (
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
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum documento encontrado</h2>
            <p className="text-slate-500">Os documentos da sua base documental aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documentos.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(doc.type)}`}>
                    {doc.type}
                  </span>
                  <span className="text-xs text-slate-500">{formatSize(doc.sizeBytes)}</span>
                </div>
                <p className="text-sm font-medium text-slate-900 mb-1 line-clamp-1">{doc.originalName}</p>
                <div className="space-y-1 text-xs text-slate-500">
                  {doc.site && <p>Frente: {doc.site}</p>}
                  {doc.uploadedBy && <p>Enviado por: {doc.uploadedBy}</p>}
                  <p>Data: {doc.createdAt}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
                  <span className="text-xs text-slate-400 group-hover:text-navy transition-colors">
                    Abrir →
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