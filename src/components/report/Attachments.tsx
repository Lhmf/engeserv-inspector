"use client";

import { ReportPhoto } from "@/modules/report/types";
import { Image, Maximize2, X, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { useState } from "react";

interface AttachmentsProps {
  photos: ReportPhoto[];
  documents?: { id: string; name: string; type: string; url: string; description?: string; uploadedAt: Date; uploadedBy: string }[];
}

export function Attachments({ photos, documents = [] }: AttachmentsProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ReportPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredPhotos = photos.filter(p => p.url);

  const openModal = (photo: ReportPhoto, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const navigate = (direction: "prev" | "next") => {
    if (!filteredPhotos.length) return;
    setCurrentIndex(prev => {
      if (direction === "next") {
        return (prev + 1) % filteredPhotos.length;
      } else {
        return (prev - 1 + filteredPhotos.length) % filteredPhotos.length;
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      PLACA: "Placa de Identificação",
      CORROSAO: "Corrosão",
      VALVULA: "Válvula",
      MANOMETRO: "Manômetro",
      ULTRASSOM: "Ultrassom",
      VISTA_GERAL: "Vista Geral",
      SOLDA: "Solda",
      TRINCA: "Trinca",
      REPARO: "Reparo",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      PLACA: "bg-blue-100 text-blue-700",
      CORROSAO: "bg-rose-100 text-rose-700",
      VALVULA: "bg-amber-100 text-amber-700",
      MANOMETRO: "bg-emerald-100 text-emerald-700",
      ULTRASSOM: "bg-purple-100 text-purple-700",
      VISTA_GERAL: "bg-blue-100 text-blue-700",
      SOLDA: "bg-orange-100 text-orange-700",
      TRINCA: "bg-rose-100 text-rose-700",
      REPARO: "bg-amber-100 text-amber-700",
    };
    return colors[category] || "bg-slate-100 text-slate-700";
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Image className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">Anexos</h2>
              <p className="text-sm text-slate-500">Fotografias e documentos anexados ao laudo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
              {photos.length} fotos
            </span>
            {documents.length > 0 && (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                {documents.length} documentos
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Photos Grid */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-600" />
            Fotografias ({photos.length})
          </h3>

          {photos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <Image className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-600 mb-2">Nenhuma fotografia anexada</p>
              <p className="text-slate-500">As fotografias da inspeção aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                >
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(photo.category)}`}>
                      {getCategoryLabel(photo.category)}
                    </span>
                  </div>
                  <div className="aspect-square relative overflow-hidden">
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.caption || photo.category}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <Image className="w-10 h-10 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <p className="text-xs font-medium truncate">{photo.caption || getCategoryLabel(photo.category)}</p>
                    <p className="text-[10px] opacity-75">{formatDate(photo.takenAt)} por {photo.takenBy}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal(photo, index);
                    }}
                    className="absolute top-2 left-2 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Expandir foto"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        {documents.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Documentos ({documents.length})
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{doc.name}</p>
                      <p className="text-xs text-slate-500">
                        {doc.type} • {new Date(doc.uploadedAt).toLocaleString("pt-BR")} por {doc.uploadedBy}
                      </p>
                      {doc.description && <p className="text-xs text-slate-500 mt-1">{doc.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 active:scale-95">
                      <Download className="w-4 h-4" />
                      Baixar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal for full-size photo viewing */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={closeModal} role="dialog" aria-modal="true" aria-label="Visualização de foto">
            <div className="relative max-w-5xl max-h-[90vh] w-full mx-4">
              <button
                onClick={closeModal}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Fechar"
              >
                <X className="w-6 h-6" />
              </button>

              {filteredPhotos.length > 1 && (
                <button
                  onClick={() => navigate("prev")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="relative aspect-square max-h-[75vh] overflow-hidden rounded-lg">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || selectedPhoto.category}
                  className="w-full h-full object-contain"
                />
              </div>

              {filteredPhotos.length > 1 && (
                <button
                  onClick={() => navigate("next")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  aria-label="Próxima"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              <div className="mt-4 px-4 text-center text-white">
                <p className="font-medium">{selectedPhoto.caption || getCategoryLabel(selectedPhoto.category)}</p>
                <p className="text-sm opacity-75 mt-1">
                  {getCategoryLabel(selectedPhoto.category)} • {formatDate(selectedPhoto.takenAt)} por {selectedPhoto.takenBy}
                </p>
                <p className="text-xs opacity-50 mt-1">{currentIndex + 1} de {filteredPhotos.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}