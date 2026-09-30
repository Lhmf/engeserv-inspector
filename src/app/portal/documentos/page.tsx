"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalNavigation } from "@/components/portal/PortalNavigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import Link from "next/link";

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

export default function DocumentosPage() {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoPortal[]>([]);
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

      const resp = await fetch("/api/portal/documentos", { credentials: "include" });
      if (!resp.ok) {
        console.error("Erro ao carregar documentos");
        return;
      }
      const data = await resp.json();
      setDocumentos(data.documentos);
      setLoading(false);
    }

    init();
  }, [router]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("word") || mimeType.includes("document")) return "doc";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "xls";
    return "file";
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "LAUDO":
        return "Laudo";
      case "ART":
        return "ART";
      case "INSPECAO":
        return "Inspeção";
      default:
        return "Outro";
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
            <h1 className="text-xl font-bold text-slate-900">Documentos</h1>
            <p className="text-sm text-slate-500">Olá, {session.name}</p>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {documentos.length === 0 ? (
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
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum documento encontrado</h2>
            <p className="text-slate-500">Documentos, ARTs e certificados aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documentos.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:border-navy/30 transition-all dark:border-slate-800 dark:bg-gray-800"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(doc.mimeType) === "pdf" && (
                    <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 2a6 6 0 00-6 6v3.586l1.707 1.707A1 1 0 006 15h8a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                    </svg>
                  )}
                  {getFileIcon(doc.mimeType) === "image" && (
                    <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2v8h12V6H6z" />
                    </svg>
                  )}
                  {getFileIcon(doc.mimeType) === "doc" && (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2v8h12V6H6z" />
                    </svg>
                  )}
                  {getFileIcon(doc.mimeType) === "xls" && (
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2v8h12V6H6z" />
                    </svg>
                  )}
                  {getFileIcon(doc.mimeType) === "file" && (
                    <svg className="w-6 h-6 text-slate-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 2v8h12V6H6z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate group-hover:text-navy transition-colors">{doc.originalName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{getTypeLabel(doc.type)}</span>
                    <span>{formatFileSize(doc.sizeBytes)}</span>
                    {doc.site && <span>Frente: {doc.site}</span>}
                    <span>{doc.createdAt}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}