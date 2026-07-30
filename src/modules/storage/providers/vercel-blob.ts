/**
 * Vercel Blob Storage Provider
 *
 * Implementa StorageService usando @vercel/blob.
 * Requer BLOB_READ_WRITE_TOKEN configurado no ambiente.
 */

import { put, del } from '@vercel/blob';
import type { StorageService, UploadResult } from '../types';

export class VercelBlobStorage implements StorageService {
  private basePath: string;

  constructor(basePath = 'engeserv') {
    this.basePath = basePath;
  }

  async upload(file: File | Blob, pathname: string): Promise<UploadResult> {
    const fullPath = `${this.basePath}/${pathname}`;
    const blob = await put(fullPath, file, { access: 'public' });

    return {
      url: blob.url,
      pathname: fullPath,
      sizeBytes: file.size,
      contentType: file.type,
    };
  }

  async uploadBuffer(
    buffer: ArrayBuffer | Uint8Array,
    pathname: string,
    contentType: string
  ): Promise<UploadResult> {
    const blob = new Blob([buffer as BlobPart], { type: contentType });
    return this.upload(blob, pathname);
  }

  async delete(pathname: string): Promise<void> {
    const fullPath = `${this.basePath}/${pathname}`;
    await del(fullPath);
  }

  async getSignedUrl(_pathname: string, _expiresInSeconds = 3600): Promise<string> {
    // Vercel Blob não suporta URLs assinadas nativamente.
    // Os blobs são públicos por padrão quando access: 'public'.
    throw new Error('URLs assinadas não suportadas pelo Vercel Blob. Use acesso público.');
  }

  async healthCheck(): Promise<boolean> {
    return !!process.env.BLOB_READ_WRITE_TOKEN;
  }
}
