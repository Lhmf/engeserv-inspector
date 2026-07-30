/**
 * StorageService — módulo de armazenamento em nuvem.
 *
 * Exporta a interface e a instância padrão (Vercel Blob).
 * Para trocar de provedor, crie um provider em ./providers/ e
 * altere a função createStorage abaixo.
 *
 * Uso:
 *   import { getStorage } from '@/modules/storage';
 *   const storage = await getStorage();
 *   const { url } = await storage.upload(file, 'path/name.jpg');
 */

import type { StorageService, StorageProvider, UploadResult } from './types';
export type { StorageService, StorageProvider, UploadResult } from './types';

let _instance: StorageService | null = null;

export async function getStorage(): Promise<StorageService> {
  if (_instance) return _instance;
  const provider = (process.env.STORAGE_PROVIDER || 'vercel-blob') as StorageProvider;
  switch (provider) {
    case 'vercel-blob': {
      const { VercelBlobStorage } = await import('./providers/vercel-blob');
      _instance = new VercelBlobStorage();
      return _instance;
    }
    default:
      throw new Error(`Provider de storage não implementado: ${provider}`);
  }
}
