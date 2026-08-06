"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Loader2, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  /** Chamado quando a foto é capturada e comprimida */
  onCapture: (blob: Blob) => void;
  /** Se deve usar a câmera frontal (selfie) */
  frontCamera?: boolean;
  /** Desabilitado */
  disabled?: boolean;
}

/**
 * CameraCapture — abre a câmera diretamente (sem passar pela galeria)
 * e retorna o blob da foto capturada com compressão automática.
 *
 * Funciona como o WhatsApp Business: abre câmera → captura → comprime → retorna blob.
 * O blob deve ser enviado ao storage/API pelo componente pai.
 */
export function CameraCapture({ onCapture, frontCamera = false, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [active, setActive] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: frontCamera ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
    } catch (e: any) {
      console.error("Camera error:", e);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, [frontCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setCapturing(true);

    // Match canvas to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compress to JPEG (reduces size ~5x-10x) — otimizado para a fila offline
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
        setCapturing(false);
        stopCamera();
      },
      "image/jpeg",
      0.72
    );
  }, [onCapture, stopCamera]);

  const retry = useCallback(() => {
    stopCamera();
    setTimeout(() => startCamera(), 300);
  }, [startCamera, stopCamera]);

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={startCamera}
          disabled={disabled}
          variant="outline"
          className="w-full"
        >
          <Camera className="w-5 h-5 mr-2" />
          {disabled ? "Processando..." : "Abrir Câmera"}
        </Button>
        {error && (
          <p className="text-xs text-rose-600 text-center">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full aspect-[4/3] object-cover"
      />

      {/* Controls Overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex items-center justify-center gap-6">
        {/* Cancel */}
        <button
          onClick={stopCamera}
          className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          title="Cancelar"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Capture */}
        <button
          onClick={capture}
          disabled={capturing}
          className="p-4 rounded-full bg-white hover:bg-slate-100 text-navy shadow-lg transition-all active:scale-95 disabled:opacity-50"
          title="Capturar foto"
        >
          {capturing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </button>

        {/* Retry (reset camera) */}
        <button
          onClick={retry}
          className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          title="Tentar novamente"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

/**
 * Helper: compress an image blob client-side.
 * Útil para comprimir imagens já existentes (da galeria em modo fallback).
 */
export function compressImage(file: File, quality = 0.72, maxWidth = 1600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;

      // Scale down if too wide
      if (w > maxWidth) {
        h = (h / w) * maxWidth;
        w = maxWidth;
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas context not available")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}
