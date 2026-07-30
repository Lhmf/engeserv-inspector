/**
 * StorageService — Interface de abstração para armazenamento em nuvem.
 *
 * Permite trocar o provedor (Vercel Blob, Supabase Storage, S3, R2, etc.)
 * sem alterar a lógica da aplicação.
 *
 * Uso:
 *   import { storage } from '@/modules/storage';
 *   const url = await storage.upload(file, 'inspections/abc-123/foto.jpg');
 */

export interface UploadResult {
  url: string;
  pathname: string;
  sizeBytes: number;
  contentType: string;
}

export interface StorageService {
  /** Faz upload de um arquivo e retorna a URL pública. */
  upload(file: File | Blob, pathname: string): Promise<UploadResult>;

  /** Faz upload de um buffer (útil para blobs já em memória). */
  uploadBuffer(
    buffer: ArrayBuffer | Uint8Array,
    pathname: string,
    contentType: string
  ): Promise<UploadResult>;

  /** Remove um arquivo pelo pathname. */
  delete(pathname: string): Promise<void>;

  /** Gera URL temporária (assinada) para acesso privado. */
  getSignedUrl(pathname: string, expiresInSeconds?: number): Promise<string>;

  /** Verifica se o storage está configurado e acessível. */
  healthCheck(): Promise<boolean>;
}

export type StorageProvider = 'vercel-blob' | 'supabase' | 's3' | 'r2';
