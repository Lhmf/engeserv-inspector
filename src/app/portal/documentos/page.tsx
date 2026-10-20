"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDataBR, Loading, PageHeader } from "@/components/portal/ui";

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
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"LAUDO" | "ART" | "INSPECAO" | "OUTRO" | "all">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
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
        const resp = await fetch("/api/portal/documentos", { credentials: "include" });
        if (resp.status === 401) {
          router.replace("/portal/login");
          return;
        }
        if (!resp.ok) {
          setError("Erro ao carregar documentos. Tente novamente mais tarde.");
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setDocumentos(data.documentos || []);
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
        <Loading size="lg" text="Carregando documentos..." />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
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

  // Filter and search
  const filteredDocumentos = documentos
    .filter(doc => filterType === "all" || doc.type === filterType)
    .filter(doc => searchTerm === "" || doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-white dark:bg-gray-800 min-h-screen">
      <PageHeader
        title="Documentos"
        subtitle={`Olá, ${session.name} — ARTs, certificados e anexos liberados para o portal`}
      />      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Tipo</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === "all" ? "bg-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType("LAUDO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === "LAUDO" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
                >
                  Laudo
                </button>
                <button
                  onClick={() => setFilterType("ART")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === "ART" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"}`}
                >
                  ART
                </button>
                <button
                  onClick={() => setFilterType("INSPECAO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === "INSPECAO" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"}`}
                >
                  Inspeção
                </button>
                <button
                  onClick={() => setFilterType("OUTRO")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === "OUTRO" ? "bg-slate-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  Outro
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="search-doc" className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 block">Pesquisar</label>
              <input
                id="search-doc"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome do documento"
                className="px-3 py-1.5 rounded border border-slate-200 focus:border-navy focus:ring-navy/20 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {filteredDocumentos.length === 0 ? (
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
              <h2 className="text-lg font-medium text-slate-900 mb-1">Nenhum documento encontrado</h2>
              <p className="text-slate-500">Nenhum documento corresponde aos filtros selecionados.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocumentos.map((doc) => (
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
                    <span>{formatDataBR(doc.createdAt)}</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}