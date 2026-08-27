/**
 * NR-13 Report Template - Types
 * 
 * Template-specific types for the NR-13 report layout.
 * These types define the visual structure, not business logic.
 */

import type { TechnicalReport, ReportPhoto } from '../../types';
import type { MeasurementPoint } from '@/modules/engineering/types';

// ============================================================
// TEMPLATE DATA INPUT
// ============================================================

export interface Nr13TemplateData {
  report: TechnicalReport;
  company: CompanyInfo;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  cnpj?: string;
}

// ============================================================
// PAGE TYPES
// ============================================================

export type PageType = 
  | 'cover'
  | 'identification'
  | 'status-and-results'
  | 'photos'
  | 'conclusion-and-signatures';

// ============================================================
// STATUS DISPLAY
// ============================================================

export type StatusDisplay = {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
  bgColor: string;
  textColor: string;
  borderColor: string;
};

// ============================================================
// MEASUREMENT TABLE ROW
// ============================================================

export interface MeasurementRow {
  point: string;
  location?: string;
  thicknessMm: number;
  condition: 'OK' | 'ATTENTION' | 'CRITICAL';
  notes?: string;
}

// ============================================================
// PHOTO RECORD
// ============================================================

export interface PhotoRecord {
  id: string;
  number: number;
  category: string;
  description: string;
  location?: string;
  observation?: string;
  url: string;
}

// ============================================================
// SIGNATURE BLOCK
// ============================================================

export interface SignatureBlock {
  role: 'ELABORACAO' | 'VERIFICACAO' | 'APROVACAO';
  name: string;
  registration?: string; // CREA, CAU, etc.
  title: string;
  signedAt?: Date;
  signatureHash?: string;
}

// ============================================================
// TEMPLATE CONSTANTS
// ============================================================

export const NR13_COLORS = {
  navy: '#1a2744',
  navyLight: '#2a3f6e',
  navyDark: '#0f1a2e',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green500: '#22c55e',
  green600: '#16a34a',
  green700: '#15803d',
  yellow50: '#fefce8',
  yellow100: '#fef9c3',
  yellow500: '#eab308',
  yellow600: '#ca8a04',
  yellow700: '#a16207',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  blue50: '#eff6ff',
  blue500: '#3b82f6',
  blue600: '#2563eb',
} as const;

export const NR13_FONTS = {
  heading: 'Helvetica-Bold',
  body: 'Helvetica',
  bodyItalic: 'Helvetica-Oblique',
  mono: 'Courier',
} as const;

export const NR13_LAYOUT = {
  pageWidth: 595.28, // A4 width in points
  pageHeight: 841.89, // A4 height in points
  margin: 50,
  contentWidth: 495.28, // pageWidth - 2*margin
  headerHeight: 80,
  footerHeight: 40,
  sectionGap: 20,
} as const;
