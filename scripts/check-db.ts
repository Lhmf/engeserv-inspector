import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('=== VERIFICANDO BANCO DE DADOS ===\n');

  // 1. TechnicalReports
  const techReports = await prisma.technicalReport.findMany({
    include: {
      inspection: {
        include: {
          equipment: {
            include: {
              client: true,
            },
          },
          inspector: true,
          measurements: true,
          photos: true,
        },
      },
    },
  });

  console.log(`\n📋 TechnicalReports encontrados: ${techReports.length}`);
  for (const tr of techReports) {
    console.log(`\n  ID: ${tr.id}`);
    console.log(`  ReportNumber: ${tr.reportNumber}`);
    console.log(`  Status: ${tr.status}`);
    console.log(`  Version: ${tr.version}`);
    console.log(`  InspectionDate: ${tr.inspectionDate}`);
    console.log(`  Inspection: ${tr.inspection?.id || 'N/A'}`);
    console.log(`  Equipment: ${tr.inspection?.equipment?.tag || 'N/A'} (${tr.inspection?.equipment?.type || 'N/A'})`);
    console.log(`  Client: ${tr.inspection?.equipment?.client?.companyName || 'N/A'}`);
    console.log(`  Measurements: ${tr.inspection?.measurements?.length || 0}`);
    console.log(`  Photos: ${tr.inspection?.photos?.length || 0}`);
    console.log(`  Has executiveSummary: ${!!tr.executiveSummary}`);
    console.log(`  Has inspectionData: ${!!tr.inspectionData}`);
    console.log(`  Has engineeringResults: ${!!tr.engineeringResults}`);
    console.log(`  Has technicalConclusion: ${!!tr.technicalConclusion}`);
    console.log(`  Has recommendations: ${!!tr.recommendations}`);
    console.log(`  Has nextInspection: ${!!tr.nextInspection}`);
    console.log(`  Has attachments: ${!!tr.attachments}`);
    console.log(`  Has signatures: ${!!tr.signatures}`);
    console.log(`  Has history: ${!!tr.history}`);
  }

  // 2. Inspections
  const inspections = await prisma.inspection.findMany({
    include: {
      equipment: { include: { client: true } },
      measurements: true,
      photos: true,
      inspector: true,
    },
  });
  console.log(`\n\n🔍 Inspeções encontradas: ${inspections.length}`);
  for (const i of inspections) {
    console.log(`  ${i.id} | ${i.status} | ${i.equipment?.tag} | Medições: ${i.measurements?.length} | Fotos: ${i.photos?.length}`);
  }

  // 3. Equipamentos
  const equipments = await prisma.equipment.findMany({ include: { client: true } });
  console.log(`\n📦 Equipamentos: ${equipments.length}`);
  for (const e of equipments) {
    console.log(`  ${e.id} | ${e.tag} | ${e.type} | ${e.client?.companyName}`);
  }

  // 4. Clients
  const clients = await prisma.client.findMany();
  console.log(`\n🏢 Clientes: ${clients.length}`);

  // 5. TextTemplates
  const templates = await prisma.textTemplate.findMany();
  console.log(`\n📝 TextTemplates: ${templates.length}`);

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);