/**
 * NR-13 Template — Signatures (Blocos de Assinatura)
 * 
 * Bloco de responsabilidade técnica: nome, formação, CREA, ART,
 * assinatura e data. Espaços para: Elaboração, Verificação, Aprovação.
 * Preparado para futura assinatura digital.
 */

import type { TechnicalReport, ReportSignature } from '../../types';

export interface SignaturesProps {
  report: TechnicalReport;
}

/**
 * Renderiza os blocos de assinatura.
 */
export function renderSignatures(data: SignaturesProps): string {
  const { report } = data;
  const { signatures, identification } = report;

  return `
    <div class="nr13-section nr13-signatures">
      <h2 class="section-title">
        <span class="section-number">12</span>
        RESPONSABILIDADE TÉCNICA
      </h2>

      <p class="signatures-intro">
        O presente laudo técnico é de responsabilidade dos profissionais abaixo assinados,
        conforme legislação vigente e normas técnicas aplicáveis.
      </p>

      <div class="signatures-grid">
        <!-- Elaboração -->
        ${renderSignatureBlock({
          role: 'ELABORAÇÃO',
          name: identification.inspectorName,
          registration: signatures.inspector?.userRegistration,
          title: 'Inspetor Técnico',
          signature: signatures.inspector,
          artNumber: identification.artNumber,
        })}

        <!-- Verificação -->
        ${renderSignatureBlock({
          role: 'VERIFICAÇÃO',
          name: identification.engineerName || '—',
          registration: signatures.engineer?.userRegistration,
          title: 'Engenheiro Responsável',
          signature: signatures.engineer,
        })}

        <!-- Aprovação -->
        ${renderSignatureBlock({
          role: 'APROVAÇÃO',
          name: identification.managerName || '—',
          registration: signatures.manager?.userRegistration,
          title: 'Gestor Técnico',
          signature: signatures.manager,
        })}
      </div>

      ${identification.artNumber ? `
      <div class="signatures-art">
        <strong>ART Nº ${identification.artNumber}</strong> — Anotação de Responsabilidade Técnica
        ${identification.issuedAt ? ` — Emitida em ${formatDateBR(identification.issuedAt)}` : ''}
      </div>
      ` : ''}
    </div>
  `;
}

interface SignatureBlockData {
  role: string;
  name: string;
  registration?: string;
  title: string;
  signature?: ReportSignature;
  artNumber?: string;
}

function renderSignatureBlock(data: SignatureBlockData): string {
  const { role, name, registration, title, signature } = data;
  const isSigned = signature && signature.status === 'APPROVED';

  return `
    <div class="signature-block ${isSigned ? 'signature-block--signed' : 'signature-block--pending'}">
      <div class="signature-role">${role}</div>
      <div class="signature-line"></div>
      <div class="signature-info">
        <div class="signature-name">${isSigned ? name : '______________________________________'}</div>
        <div class="signature-title">${title}</div>
        ${registration ? `<div class="signature-registration">${registration}</div>` : ''}
        ${isSigned && signature?.signedAt ? `
        <div class="signature-date">Data: ${formatDateBR(signature.signedAt)}</div>
        ` : `
        <div class="signature-date">Data: ____/____/________</div>
        `}
      </div>
      <div class="signature-status">
        ${isSigned 
          ? '<span class="sig-status sig-status--signed">✓ Assinado</span>' 
          : '<span class="sig-status sig-status--pending">Pendente</span>'}
      </div>
    </div>
  `;
}

function formatDateBR(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
