import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Buscar o laudo técnico
    const technicalReport = await prisma.technicalReport.findUnique({
      where: { id },
      include: {
        inspection: {
          include: {
            equipment: {
              include: {
                client: true,
              },
            },
            inspector: true,
          },
        },
      },
    });

    if (!technicalReport) {
      return NextResponse.json({ error: 'Laudo não encontrado.' }, { status: 404 });
    }

    // Verificar acesso (opcional - pode verificar se usuário tem permissão)

    // Parse dos dados JSON
    const clientData = JSON.parse(technicalReport.clientData);
    const equipmentData = JSON.parse(technicalReport.equipmentData);
    const executiveSummary = JSON.parse(technicalReport.executiveSummary);
    const inspectionData = JSON.parse(technicalReport.inspectionData);
    const engineeringResults = JSON.parse(technicalReport.engineeringResults);
    const technicalConclusion = JSON.parse(technicalReport.technicalConclusion);
    const recommendations = JSON.parse(technicalReport.recommendations);
    const nextInspection = JSON.parse(technicalReport.nextInspection);
    const attachments = JSON.parse(technicalReport.attachments);
    const history = JSON.parse(technicalReport.history);
    const validations = JSON.parse(technicalReport.validations);
    const signatures = JSON.parse(technicalReport.signatures);
    const metadata = JSON.parse(technicalReport.metadata);

    // Criar PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageSize = PageSizes.A4;
    const margin = 50;
    const pageWidth = pageSize[0];
    const pageHeight = pageSize[1];
    const contentWidth = pageWidth - 2 * margin;

    let currentPage = pdfDoc.addPage(pageSize);
    let y = pageHeight - margin;

    // Função auxiliar para adicionar texto
    const addText = (text: string, x: number, y: number, font = helvetica, size = 10, color = rgb(0, 0, 0), maxWidth?: number) => {
      if (maxWidth) {
        const words = text.split(' ');
        let line = '';
        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const width = font.widthOfTextAtSize(testLine, size);
          if (width > maxWidth) {
            currentPage.drawText(line, { x, y, font, size, color });
            y -= size * 1.3;
            line = word;
            if (y < margin) {
              currentPage = pdfDoc.addPage(pageSize);
              y = pageHeight - margin;
            }
          } else {
            line = testLine;
          }
        }
        if (line) {
          currentPage.drawText(line, { x, y, font, size, color });
          y -= size * 1.3;
        }
      } else {
        currentPage.drawText(text, { x, y, font, size, color });
        y -= size * 1.3;
      }
      return y;
    };

    const addTitle = (text: string, x: number, y: number, size = 14) => {
      y = addText(text, x, y, helveticaBold, size, rgb(0.1, 0.2, 0.4));
      currentPage.drawLine({
        start: { x, y: y + 2 },
        end: { x: x + contentWidth, y: y + 2 },
        thickness: 1,
        color: rgb(0.1, 0.2, 0.4),
      });
      y -= 10;
      return y;
    };

    const addSectionTitle = (text: string) => {
      if (y < margin + 40) {
        currentPage = pdfDoc.addPage(pageSize);
        y = pageHeight - margin;
      }
      y = addTitle(text, margin, y, 12);
      return y;
    };

    const checkSpace = (lines: number = 3) => {
      if (y < margin + lines * 13) {
        currentPage = pdfDoc.addPage(pageSize);
        y = pageHeight - margin;
      }
    };

    // ============ CAPA ============
    // EngeServ Brand Bar
    currentPage.drawRectangle({
      x: 0,
      y: pageHeight - 100,
      width: pageWidth,
      height: 100,
      color: rgb(0.1, 0.2, 0.4),
    });

    y = addText('EngeServ Inspector', margin, pageHeight - 40, helveticaBold, 24, rgb(1, 1, 1));
    y = addText('Laudo Técnico de Inspeção NR-13', margin, y, helvetica, 14, rgb(0.7, 0.8, 1));

    y = pageHeight - 130;

    // Número do laudo
    y = addText(`Laudo: ${technicalReport.reportNumber}`, margin, y, helveticaBold, 16, rgb(0.1, 0.2, 0.4));
    y = addText(`Versão: ${technicalReport.version}`, margin, y, helvetica, 12, rgb(0.4, 0.4, 0.4));
    y = addText(`Status: ${technicalReport.status}`, margin, y, helvetica, 12, rgb(0.4, 0.4, 0.4));
    y -= 10;

    // Cliente
    checkSpace(5);
    y = addSectionTitle('1. IDENTIFICAÇÃO DO CLIENTE');
    y = addText(`Razão Social: ${clientData.name || 'Não informado'}`, margin, y);
    if (clientData.cnpj) y = addText(`CNPJ: ${clientData.cnpj}`, margin, y);
    if (clientData.address) y = addText(`Endereço: ${clientData.address}`, margin, y);
    if (clientData.city && clientData.state) y = addText(`${clientData.city}, ${clientData.state}`, margin, y);
    if (clientData.responsibleTechnicalName) y = addText(`Resp. Técnico: ${clientData.responsibleTechnicalName}`, margin, y);
    y -= 10;

    // Equipamento
    checkSpace(5);
    y = addSectionTitle('2. IDENTIFICAÇÃO DO EQUIPAMENTO');
    y = addText(`TAG: ${equipmentData.tag || 'Não informado'}`, margin, y);
    y = addText(`Tipo: ${equipmentData.type?.replace(/_/g, ' ') || 'Não informado'}`, margin, y);
    if (equipmentData.description) y = addText(`Descrição: ${equipmentData.description}`, margin, y, helvetica, 10, rgb(0, 0, 0), contentWidth);
    if (equipmentData.manufacturer) y = addText(`Fabricante: ${equipmentData.manufacturer}`, margin, y);
    if (equipmentData.serialNumber) y = addText(`N/S: ${equipmentData.serialNumber}`, margin, y);
    if (equipmentData.manufactureYear) y = addText(`Ano Fabricação: ${equipmentData.manufactureYear}`, margin, y);
    if (equipmentData.designCode) y = addText(`Código de Projeto: ${equipmentData.designCode}`, margin, y);
    y -= 10;

    // Dados da Inspeção
    checkSpace(5);
    y = addSectionTitle('3. DADOS DA INSPEÇÃO');
    const inspData = inspectionData.inspection || {};
    y = addText(`Tipo: ${inspData.type || 'PERIODICA'}`, margin, y);
    y = addText(`Data Inspeção: ${technicalReport.inspectionDate ? new Date(technicalReport.inspectionDate).toLocaleDateString('pt-BR') : 'Não informado'}`, margin, y);
    y = addText(`Inspetor: ${technicalReport.inspectorName || 'Não informado'}`, margin, y);
    if (technicalReport.engineerName) y = addText(`Engenheiro: ${technicalReport.engineerName}`, margin, y);
    y -= 10;

    // Escopo
    checkSpace(5);
    y = addSectionTitle('4. ESCOPO');
    y = addText('Este laudo técnico tem por objetivo apresentar os resultados da inspeção de segurança realizada no equipamento identificado acima, conforme requisitos da NR-13, ASME BPVC VIII-1 e normas aplicáveis.', margin, y, helvetica, 10, rgb(0, 0, 0), contentWidth);
    y -= 10;

    // Metodologia
    checkSpace(5);
    y = addSectionTitle('5. METODOLOGIA');
    y = addText('A inspeção foi realizada através de:', margin, y);
    y = addText('• Inspeção visual externa e interna (quando acessível)', margin + 10, y, helvetica, 10, rgb(0, 0, 0), contentWidth - 10);
    y = addText('• Medições de espessura por ultrassom nos pontos definidos', margin + 10, y, helvetica, 10, rgb(0, 0, 0), contentWidth - 10);
    y = addText('• Verificação de dispositivos de segurança (válvulas, manômetros)', margin + 10, y, helvetica, 10, rgb(0, 0, 0), contentWidth - 10);
    y = addText('• Análise de integridade estrutural via Engineering Engine', margin + 10, y, helvetica, 10, rgb(0, 0, 0), contentWidth - 10);
    y -= 10;

    // Medições
    checkSpace(5);
    y = addSectionTitle('6. MEDIÇÕES TÉCNICAS');
    const measurements = inspectionData.measurements || [];
    if (measurements.length > 0) {
      // Cabeçalho da tabela
      const colWidths = [60, 80, 80, 80, contentWidth - 300];
      const headers = ['Ponto', 'Espessura (mm)', 'Ângulo (°)', 'Status', 'Observações'];
      let x = margin;
      currentPage.drawRectangle({
        x: margin,
        y: y - 2,
        width: contentWidth,
        height: 20,
        color: rgb(0.1, 0.2, 0.4),
      });
      headers.forEach((header, i) => {
        currentPage.drawText(header, { x: x + 3, y: y + 3, font: helveticaBold, size: 8, color: rgb(1, 1, 1) });
        x += colWidths[i];
      });
      y -= 22;

      // Linhas da tabela
      for (const m of measurements) {
        checkSpace(2);
        x = margin;
        const rowColor = y % 40 < 20 ? rgb(0.95, 0.95, 0.95) : rgb(1, 1, 1);
        currentPage.drawRectangle({
          x: margin,
          y: y - 2,
          width: contentWidth,
          height: 18,
          color: rowColor,
        });
        const vals = [m.point || '', m.thicknessMm?.toFixed(2) || '', m.angleDeg?.toString() || '', m.status || 'OK', m.notes || ''];
        vals.forEach((val, i) => {
          currentPage.drawText(val, { x: x + 3, y: y + 1, font: helvetica, size: 8, color: rgb(0, 0, 0) });
          x += colWidths[i];
        });
        y -= 20;
      }

      // Estatísticas
      const stats = inspectionData.measurementStats || {};
      y -= 5;
      y = addText(`Total de pontos: ${stats.count || measurements.length}`, margin, y, helveticaBold, 10);
      y = addText(`Mínima: ${stats.minThicknessMm?.toFixed(2) || 'N/A'} mm`, margin, y);
      y = addText(`Máxima: ${stats.maxThicknessMm?.toFixed(2) || 'N/A'} mm`, margin, y);
      y = addText(`Média: ${stats.avgThicknessMm?.toFixed(2) || 'N/A'} mm`, margin, y);
      if (stats.belowMinCount > 0) {
        y = addText(`Pontos abaixo do mínimo: ${stats.belowMinCount} (${stats.belowMinPercentage?.toFixed(1) || 0}%)`, margin, y, helveticaBold, 10, rgb(0.8, 0.2, 0.2));
      }
    } else {
      y = addText('Nenhuma medição registrada.', margin, y, helveticaOblique, 10);
    }
    y -= 10;

    // Resultados de Engenharia
    checkSpace(5);
    y = addSectionTitle('7. RESULTADOS E ANÁLISE DE ENGENHARIA');
    const integrity = engineeringResults.integrityAnalysis || {};
    y = addText(`Status Geral: ${integrity.overallStatus || 'INDETERMINADO'}`, margin, y, helveticaBold, 10);
    y = addText(`Criticidade: ${integrity.overallCriticality || 'NOT_ASSESSED'}`, margin, y);
    
    const calculations = engineeringResults.calculations || [];
    for (const calc of calculations) {
      checkSpace(3);
      y = addText(`${calc.label}: ${calc.value} ${calc.unit}`, margin, y);
      y = addText(`  Status: ${calc.status} | Criticidade: ${calc.criticality}`, margin + 10, y, helvetica, 9, rgb(0.3, 0.3, 0.3));
      if (calc.explanation) {
        y = addText(`  ${calc.explanation}`, margin + 10, y, helvetica, 9, rgb(0.3, 0.3, 0.3), contentWidth - 20);
      }
      y -= 3;
    }
    y -= 10;

    // Registro Fotográfico
    checkSpace(5);
    y = addSectionTitle('8. REGISTRO FOTOGRÁFICO');
    const photos = attachments.photos || [];
    if (photos.length > 0) {
      y = addText(`Total de fotos: ${photos.length}`, margin, y);
      const categories = [...new Set(photos.map((p: any) => p.category))];
      for (const cat of categories) {
        checkSpace(3);
        const catPhotos = photos.filter((p: any) => p.category === cat);
        y = addText(`${cat} (${catPhotos.length} foto(s))`, margin, y, helveticaBold, 10);
        for (const p of catPhotos) {
          checkSpace(2);
          y = addText(`  • ${p.caption || 'Sem legenda'} - ${p.url}`, margin + 10, y, helvetica, 9, rgb(0.3, 0.3, 0.3), contentWidth - 20);
        }
      }
    } else {
      y = addText('Nenhuma foto registrada.', margin, y, helveticaOblique, 10);
    }
    y -= 10;

    // Recomendações
    checkSpace(5);
    y = addSectionTitle('9. RECOMENDAÇÕES');
    const recSections = [
      { title: 'Imediatas (Críticas)', items: recommendations.immediate || [] },
      { title: 'Curto Prazo (até 6 meses)', items: recommendations.shortTerm || [] },
      { title: 'Médio Prazo (6-18 meses)', items: recommendations.mediumTerm || [] },
      { title: 'Longo Prazo (18+ meses)', items: recommendations.longTerm || [] },
    ];

    for (const section of recSections) {
      if (section.items.length > 0) {
        checkSpace(section.items.length + 2);
        y = addText(section.title, margin, y, helveticaBold, 10);
        for (const rec of section.items) {
          checkSpace(2);
          y = addText(`  • [${rec.priority}] ${rec.description}`, margin + 10, y, helvetica, 9, rgb(0, 0, 0), contentWidth - 20);
          if (rec.referencedStandard) {
            y = addText(`    Ref: ${rec.referencedStandard}`, margin + 20, y, helveticaOblique, 8, rgb(0.4, 0.4, 0.4), contentWidth - 30);
          }
        }
        y -= 5;
      }
    }
    y -= 10;

    // Conclusão
    checkSpace(5);
    y = addSectionTitle('10. CONCLUSÃO');
    y = addText(`Conclusão: ${technicalConclusion.conclusion || 'INDETERMINADO'}`, margin, y, helveticaBold, 10);
    if (technicalConclusion.justification) {
      y = addText('Justificativa:', margin, y, helveticaBold, 10);
      y = addText(technicalConclusion.justification, margin + 10, y, helvetica, 10, rgb(0, 0, 0), contentWidth - 20);
    }
    if (technicalConclusion.complianceStatement) {
      y -= 5;
      y = addText(technicalConclusion.complianceStatement, margin, y, helveticaOblique, 9, rgb(0.3, 0.3, 0.3), contentWidth);
    }
    if (technicalConclusion.restrictions && technicalConclusion.restrictions.length > 0) {
      y -= 5;
      y = addText('Restrições:', margin, y, helveticaBold, 10);
      for (const r of technicalConclusion.restrictions) {
        y = addText(`  • ${r}`, margin + 10, y, helvetica, 9, rgb(0.8, 0.2, 0.2), contentWidth - 20);
      }
    }
    y -= 10;

    // Validade
    checkSpace(5);
    y = addSectionTitle('11. VALIDADE');
    const nextInsp = nextInspection;
    if (nextInsp.recommendedDate) {
      const date = new Date(nextInsp.recommendedDate);
      y = addText(`Próxima Inspeção Recomendada: ${date.toLocaleDateString('pt-BR')}`, margin, y);
    }
    y = addText(`Intervalo Máximo: ${nextInsp.maxIntervalMonths || 12} meses`, margin, y);
    y = addText(`Tipo: ${nextInsp.type || 'PERIODIC'}`, margin, y);
    if (nextInsp.justification) {
      y = addText(`Justificativa: ${nextInsp.justification}`, margin, y, helvetica, 10, rgb(0, 0, 0), contentWidth);
    }
    if (nextInsp.scope && nextInsp.scope.length > 0) {
      y = addText('Escopo:', margin, y, helveticaBold, 10);
      for (const s of nextInsp.scope) {
        y = addText(`  • ${s}`, margin + 10, y, helvetica, 9, rgb(0, 0, 0), contentWidth - 20);
      }
    }
    y -= 10;

    // Responsável Técnico / Assinatura
    checkSpace(8);
    y = addSectionTitle('12. RESPONSÁVEL TÉCNICO / ASSINATURA');
    if (signatures.engineer) {
      y = addText(`Engenheiro: ${signatures.engineer.userName}`, margin, y);
      y = addText(`CREA/CAU: ${signatures.engineer.userRegistration || 'Não informado'}`, margin, y);
      y = addText(`Data: ${signatures.engineer.signedAt ? new Date(signatures.engineer.signedAt).toLocaleDateString('pt-BR') : 'Não assinado'}`, margin, y);
      y = addText(`Status: ${signatures.engineer.status}`, margin, y);
    } else {
      y = addText('Engenheiro: Não assinado', margin, y);
    }
    y -= 10;
    if (signatures.manager) {
      y = addText(`Gestor: ${signatures.manager.userName}`, margin, y);
      y = addText(`Data: ${signatures.manager.signedAt ? new Date(signatures.manager.signedAt).toLocaleDateString('pt-BR') : 'Não assinado'}`, margin, y);
      y = addText(`Status: ${signatures.manager.status}`, margin, y);
    } else {
      y = addText('Gestor: Não assinado', margin, y);
    }
    y -= 10;
    if (signatures.inspector) {
      y = addText(`Inspetor: ${signatures.inspector.userName}`, margin, y);
      y = addText(`Data: ${signatures.inspector.signedAt ? new Date(signatures.inspector.signedAt).toLocaleDateString('pt-BR') : 'Não assinado'}`, margin, y);
      y = addText(`Status: ${signatures.inspector.status}`, margin, y);
    } else {
      y = addText('Inspetor: Não assinado', margin, y);
    }

    // Rodapé com paginação
    const pages = pdfDoc.getPages();
    pages.forEach((page, index) => {
      page.drawText(
        `EngeServ Inspector — Laudo Técnico ${technicalReport.reportNumber} — Página ${index + 1} de ${pages.length}`,
        {
          x: margin,
          y: margin - 20,
          font: helvetica,
          size: 7,
          color: rgb(0.5, 0.5, 0.5),
        }
      );
    });

    // Gerar bytes do PDF
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laudo-${technicalReport.reportNumber}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar PDF' }, { status: 500 });
  }
}