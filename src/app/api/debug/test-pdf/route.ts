/**
 * Debug endpoint to test PDF generation with mock data.
 * Only available in development.
 */
import { NextResponse } from 'next/server';
import { buildNr13Pdf } from '@/modules/report/templates/nr13/pdf/builder';
import { MOCK_REPORT, MOCK_COMPANY } from '@/modules/report/templates/nr13/mock-data';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug only' }, { status: 403 });
  }

  try {
    const pdfBytes = await buildNr13Pdf(MOCK_REPORT, MOCK_COMPANY);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-nr13-mock.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Test PDF error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
