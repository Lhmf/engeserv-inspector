import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDocumentUpload, validatePhotoUpload } from '@/lib/upload-validation';

function file(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

test('uploads de foto aceitam apenas tipo, extensão e tamanho permitidos', () => {
  assert.equal(validatePhotoUpload(file('campo.jpg', 'image/jpeg', 1024)), null);
  assert.match(validatePhotoUpload(file('campo.exe', 'image/jpeg', 1024)) ?? '', /imagem JPG/);
  assert.match(validatePhotoUpload(file('campo.jpg', 'image/png', 1024)) ?? '', /imagem JPG/);
  assert.match(validatePhotoUpload(file('campo.jpg', 'image/jpeg', 10 * 1024 * 1024 + 1)) ?? '', /10 MB/);
});

test('uploads de documento aceitam PDF/imagem e rejeitam extensão, tipo e tamanho inválidos', () => {
  assert.equal(validateDocumentUpload(file('ficha.pdf', 'application/pdf', 1024)), null);
  assert.match(validateDocumentUpload(file('ficha.pdf.exe', 'application/pdf', 1024)) ?? '', /PDF/);
  assert.match(validateDocumentUpload(file('ficha.pdf', 'image/png', 1024)) ?? '', /PDF/);
  assert.match(validateDocumentUpload(file('ficha.pdf', 'application/pdf', 20 * 1024 * 1024 + 1)) ?? '', /20 MB/);
});
