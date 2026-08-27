'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, ZoomIn, ZoomOut, Download, Printer, Maximize2, Minimize2 } from 'lucide-react';
import type { TechnicalReport } from '@/modules/report/types';
import type { Nr13TemplateData, CompanyInfo } from '@/modules/report/templates/nr13/types';
import { MOCK_COMPANY } from '@/modules/report/templates/nr13/mock-data';
import { renderNr13ReportWithStyles } from '@/modules/report/templates/nr13';

interface ReportPreviewProps {
  report: TechnicalReport;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

export function ReportPreview({ report, onExportPdf, isExportingPdf }: ReportPreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generatePreview();
  }, [report]);

  const generatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create template data with report and company info
      const templateData: Nr13TemplateData = {
        report,
        company: MOCK_COMPANY,
      };
      
      // Generate HTML preview using the existing template system
      const previewHtml = renderNr13ReportWithStyles(templateData);
      setHtml(previewHtml);
    } catch (err: any) {
      console.error('Error generating preview:', err);
      setError(err.message || 'Erro ao gerar preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (html && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.print();
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-navy animate-spin" />
          <p className="text-sm text-slate-600">Gerando preview do laudo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button
            onClick={generatePreview}
            className="px-4 py-2 bg-navy text-white rounded-lg text-sm hover:bg-navy/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-t-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-sm text-slate-600 font-medium min-w-[50px] text-center">
            {zoom}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-xs text-slate-600"
            title="Resetar zoom"
          >
            100%
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-slate-600" />
            ) : (
              <Maximize2 className="w-4 h-4 text-slate-600" />
            )}
          </button>
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview iframe */}
      <div 
        className="border border-t-0 border-slate-200 rounded-b-xl overflow-auto bg-slate-100"
        style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '800px' }}
      >
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            minHeight: `${100 * (297 / 210)}%`,
          }}
          title="Preview do Laudo NR-13"
        />
      </div>
    </div>
  );
}
