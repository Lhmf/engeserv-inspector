/**
 * Report Domain - ID Generator
 * 
 * Utilitário para geração de IDs únicos.
 */

let idCounter = 0;

export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const counter = (++idCounter).toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${counter}_${random}`;
}

export function generateNumericId(length: number = 8): string {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}

export function generateReportNumber(year: number, sequence: number): string {
  return `LT-${year}-${sequence.toString().padStart(5, '0')}`;
}