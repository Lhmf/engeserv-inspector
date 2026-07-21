import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de demonstração...\n");

  // ================================================================
  // 1. USUÁRIOS
  // ================================================================
  const passwordHash = await bcrypt.hash("demo123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@engeserv.com.br" },
    update: {},
    create: {
      email: "admin@engeserv.com.br",
      name: "Admin Master",
      passwordHash,
      role: "ADMIN_MASTER",
      phone: "+55 11 99999-0001",
      active: true,
    },
  });

  const gestor = await prisma.user.upsert({
    where: { email: "gestor@engeserv.com.br" },
    update: {},
    create: {
      email: "gestor@engeserv.com.br",
      name: "Carlos Gestor",
      passwordHash,
      role: "GESTOR",
      phone: "+55 11 99999-0002",
      active: true,
      createdById: admin.id,
    },
  });

  const inspetor1 = await prisma.user.upsert({
    where: { email: "inspetor1@engeserv.com.br" },
    update: {},
    create: {
      email: "inspetor1@engeserv.com.br",
      name: "João Inspetor",
      passwordHash,
      role: "FUNCIONARIO",
      phone: "+55 11 99999-0003",
      active: true,
      createdById: gestor.id,
    },
  });

  const inspetor2 = await prisma.user.upsert({
    where: { email: "inspetor2@engeserv.com.br" },
    update: {},
    create: {
      email: "inspetor2@engeserv.com.br",
      name: "Maria Técnica",
      passwordHash,
      role: "FUNCIONARIO",
      phone: "+55 11 99999-0004",
      active: true,
      createdById: gestor.id,
    },
  });

  console.log("✅ Usuários criados");

  // ================================================================
  // 2. CLIENTES
  // ================================================================
  const cliente1 = await prisma.client.upsert({
    where: { id: "cli-001" },
    update: {},
    create: {
      id: "cli-001",
      companyName: "Petrobras S.A.",
      cnpj: "33.000.167/0001-01",
      address: "Av. República do Chile, 65 - Centro, Rio de Janeiro - RJ",
      contactName: "Eng. Roberto Silva",
      contactPhone: "+55 21 3224-1234",
      contactEmail: "roberto.silva@petrobras.com.br",
      active: true,
      responsibleId: gestor.id,
    },
  });

  const cliente2 = await prisma.client.upsert({
    where: { id: "cli-002" },
    update: {},
    create: {
      id: "cli-002",
      companyName: "Vale S.A.",
      cnpj: "33.592.510/0001-54",
      address: "Praia de Botafogo, 186 - Botafogo, Rio de Janeiro - RJ",
      contactName: "Eng. Patricia Costa",
      contactPhone: "+55 21 3485-5000",
      contactEmail: "patricia.costa@vale.com",
      active: true,
      responsibleId: gestor.id,
    },
  });

  const cliente3 = await prisma.client.upsert({
    where: { id: "cli-003" },
    update: {},
    create: {
      id: "cli-003",
      companyName: "Braskem S.A.",
      cnpj: "42.150.391/0001-70",
      address: "Rua Eixo Central, s/n - Polo Petroquímico, Camaçari - BA",
      contactName: "Eng. Fernando Oliveira",
      contactPhone: "+55 71 3209-5000",
      contactEmail: "fernando.oliveira@braskem.com.br",
      active: true,
      responsibleId: inspetor1.id,
    },
  });

  const cliente4 = await prisma.client.upsert({
    where: { id: "cli-004" },
    update: {},
    create: {
      id: "cli-004",
      companyName: "Raízen Energia S.A.",
      cnpj: "08.873.681/0001-76",
      address: "Av. Presidente Juscelino Kubitschek, 1327 - Vila Nova Conceição, São Paulo - SP",
      contactName: "Eng. Camila Santos",
      contactPhone: "+55 11 3048-6000",
      contactEmail: "camila.santos@raizen.com.br",
      active: true,
      responsibleId: inspetor2.id,
    },
  });

  const cliente5 = await prisma.client.upsert({
    where: { id: "cli-005" },
    update: {},
    create: {
      id: "cli-005",
      companyName: "Ultrapar Participações S.A.",
      cnpj: "02.929.731/0001-86",
      address: "Av. Brigadeiro Faria Lima, 3600 - Itaim Bibi, São Paulo - SP",
      contactName: "Eng. Ricardo Mendes",
      contactPhone: "+55 11 3177-7000",
      contactEmail: "ricardo.mendes@ultrapar.com.br",
      active: true,
      responsibleId: gestor.id,
    },
  });

  console.log("✅ Clientes criados");

  // ================================================================
  // 3. EQUIPAMENTOS - usar prisma.$executeRaw para IDs fixos
  // ================================================================
  // Como o upsert com IDs fixos tem problemas de tipagem, vamos usar delete + create
  // ou apenas create ignorando erros de duplicata

  const equipamentos = [
    {
      id: "eq-001",
      tag: "V-101",
      type: "VASO_DE_PRESSAO",
      description: "Vaso de pressão para separação de gás/óleo",
      manufacturer: "Jaraguá Equipamentos",
      manufactureYear: 2019,
      designPressureBar: 25.0,
      originalThicknessMm: 12.0,
      minThicknessMm: 5.5,
      serialNumber: "JEQ-2019-0456",
      designCode: "ASME SEC.VIII Div.1 / 2017",
      designTempC: 120,
      operatingPressureBar: 20.0,
      operatingTempC: 85,
      mawpBar: 25.0,
      hydroTestPressureBar: 37.5,
      headType: "Semieliptico",
      headMaterial: "SA-516 Gr.70",
      bodyMaterial: "SA-516 Gr.70",
      headNominalThicknessMm: 10.0,
      volumeLiters: 5000,
      jointEfficiency: 1.0,
      fluidType: "Gás Natural / Óleo",
      fluidClass: "A",
      riskGroup: 2,
      nr13Category: "II",
      clientId: cliente1.id,
    },
    {
      id: "eq-002",
      tag: "C-201",
      type: "CALDEIRA",
      description: "Caldeira aquatubular para geração de vapor",
      manufacturer: "Babcock & Wilcox",
      manufactureYear: 2015,
      designPressureBar: 18.0,
      originalThicknessMm: 16.0,
      minThicknessMm: 8.0,
      serialNumber: "BW-2015-789",
      designCode: "ASME SEC.I / 2015",
      designTempC: 210,
      operatingPressureBar: 15.0,
      operatingTempC: 198,
      mawpBar: 18.0,
      hydroTestPressureBar: 27.0,
      headType: "Semiesferico",
      headMaterial: "SA-516 Gr.70",
      bodyMaterial: "SA-516 Gr.70",
      headNominalThicknessMm: 14.0,
      volumeLiters: 15000,
      jointEfficiency: 1.0,
      fluidType: "Água / Vapor",
      fluidClass: "A",
      riskGroup: 3,
      nr13Category: "III",
      clientId: cliente1.id,
    },
    {
      id: "eq-003",
      tag: "T-301",
      type: "TANQUE",
      description: "Tanque de armazenamento de diesel (atmosférico)",
      manufacturer: "Tecniplas",
      manufactureYear: 2020,
      designPressureBar: 0.5,
      originalThicknessMm: 8.0,
      minThicknessMm: 4.0,
      serialNumber: "TEC-2020-0123",
      designCode: "API 650 / 2018",
      designTempC: 50,
      operatingPressureBar: 0.02,
      operatingTempC: 35,
      mawpBar: 0.5,
      hydroTestPressureBar: 0.75,
      headType: "Cone",
      headMaterial: "A-36",
      bodyMaterial: "A-36",
      headNominalThicknessMm: 6.0,
      volumeLiters: 100000,
      jointEfficiency: 0.85,
      fluidType: "Diesel S10",
      fluidClass: "C",
      riskGroup: 1,
      nr13Category: "I",
      clientId: cliente2.id,
    },
    {
      id: "eq-004",
      tag: "V-401",
      type: "VASO_DE_PRESSAO",
      description: "Vaso de pressão - compressor de ar",
      manufacturer: "Atlas Copco",
      manufactureYear: 2018,
      designPressureBar: 12.0,
      originalThicknessMm: 8.0,
      minThicknessMm: 4.5,
      serialNumber: "AC-2018-445",
      designCode: "ASME SEC.VIII Div.1 / 2017",
      designTempC: 80,
      operatingPressureBar: 10.0,
      operatingTempC: 60,
      mawpBar: 12.0,
      hydroTestPressureBar: 18.0,
      headType: "Torisferico",
      headMaterial: "SA-516 Gr.70",
      bodyMaterial: "SA-516 Gr.70",
      headNominalThicknessMm: 6.5,
      volumeLiters: 2000,
      jointEfficiency: 1.0,
      fluidType: "Ar Comprimido",
      fluidClass: "B",
      riskGroup: 2,
      nr13Category: "II",
      clientId: cliente3.id,
    },
    {
      id: "eq-005",
      tag: "TC-501",
      type: "TROCADOR_DE_CALOR",
      description: "Trocador de calor casco e tubo - resfriamento de processo",
      manufacturer: "Alfa Laval",
      manufactureYear: 2021,
      designPressureBar: 16.0,
      originalThicknessMm: 10.0,
      minThicknessMm: 5.0,
      serialNumber: "AL-2021-882",
      designCode: "ASME SEC.VIII Div.1 / 2019",
      designTempC: 150,
      operatingPressureBar: 12.0,
      operatingTempC: 120,
      mawpBar: 16.0,
      hydroTestPressureBar: 24.0,
      headType: "Semieliptico",
      headMaterial: "SA-240 316L",
      bodyMaterial: "SA-240 316L",
      headNominalThicknessMm: 8.0,
      volumeLiters: 3500,
      jointEfficiency: 1.0,
      fluidType: "Água de resfriamento / Óleo",
      fluidClass: "B",
      riskGroup: 2,
      nr13Category: "II",
      clientId: cliente4.id,
    },
    {
      id: "eq-006",
      tag: "S-601",
      type: "SILO",
      description: "Silo de armazenamento de catalisador (pó)",
      manufacturer: "Silos Córdoba",
      manufactureYear: 2017,
      designPressureBar: 0.3,
      originalThicknessMm: 6.0,
      minThicknessMm: 3.0,
      serialNumber: "SC-2017-056",
      designCode: "ASME SEC.VIII Div.1 / 2017",
      designTempC: 60,
      operatingPressureBar: 0.02,
      operatingTempC: 40,
      mawpBar: 0.3,
      hydroTestPressureBar: 0.45,
      headType: "Cone",
      headMaterial: "A-36",
      bodyMaterial: "A-36",
      headNominalThicknessMm: 5.0,
      volumeLiters: 50000,
      jointEfficiency: 0.85,
      fluidType: "Catalisador FCC (sólido)",
      fluidClass: "D",
      riskGroup: 1,
      nr13Category: "I",
      clientId: cliente5.id,
    },
  ];

  for (const eq of equipamentos) {
    try {
      await prisma.equipment.create({ data: eq as any });
    } catch (e: any) {
      if (e.code !== "P2002") throw e; // ignorar unique constraint
    }
  }

  console.log("✅ Equipamentos criados");

  // ================================================================
  // 4. INSPEÇÕES
  // ================================================================
  const inspections = [
    {
      id: "insp-001",
      equipmentId: "eq-001",
      inspectorId: inspetor1.id,
      status: "APROVADA",
      startedAt: new Date("2024-01-15"),
      completedAt: new Date("2024-01-15"),
      approvedAt: new Date("2024-01-20"),
      approvedById: gestor.id,
    },
    {
      id: "insp-002",
      equipmentId: "eq-001",
      inspectorId: inspetor2.id,
      status: "EM_ANDAMENTO",
      startedAt: new Date("2024-07-10"),
    },
    {
      id: "insp-003",
      equipmentId: "eq-002",
      inspectorId: inspetor1.id,
      status: "AGUARDANDO_APROVACAO",
      startedAt: new Date("2024-06-20"),
      completedAt: new Date("2024-06-25"),
    },
    {
      id: "insp-004",
      equipmentId: "eq-003",
      inspectorId: inspetor2.id,
      status: "APROVADA",
      startedAt: new Date("2024-03-05"),
      completedAt: new Date("2024-03-05"),
      approvedAt: new Date("2024-03-10"),
      approvedById: gestor.id,
    },
    {
      id: "insp-005",
      equipmentId: "eq-004",
      inspectorId: inspetor1.id,
      status: "REJEITADA",
      startedAt: new Date("2024-05-12"),
      completedAt: new Date("2024-05-12"),
      approvedAt: new Date("2024-05-15"),
      approvedById: gestor.id,
      rejectionReason: "Espessura mínima abaixo do permitido no ponto P3. Necessário reparo ou substituição.",
    },
    {
      id: "insp-006",
      equipmentId: "eq-005",
      inspectorId: inspetor2.id,
      status: "EM_ANDAMENTO",
      startedAt: new Date("2024-07-18"),
    },
  ];

  for (const insp of inspections) {
    try {
      await prisma.inspection.create({ data: insp as any });
    } catch (e: any) {
      if (e.code !== "P2002") throw e;
    }
  }

  console.log("✅ Inspeções criadas");

  // ================================================================
  // 5. MEDIÇÕES DE ULTRASSOM
  // ================================================================
  const measurements = [
    // Inspeção 1 - V-101 (APROVADA)
    { inspectionId: "insp-001", point: "P1", thicknessMm: 11.8, angleDeg: 0, notes: "Casco - região superior" },
    { inspectionId: "insp-001", point: "P2", thicknessMm: 12.1, angleDeg: 45, notes: "Casco - região média" },
    { inspectionId: "insp-001", point: "P3", thicknessMm: 11.5, angleDeg: 90, notes: "Casco - região inferior" },
    { inspectionId: "insp-001", point: "P4", thicknessMm: 10.8, angleDeg: 0, notes: "Tampo superior" },
    { inspectionId: "insp-001", point: "P5", thicknessMm: 10.5, angleDeg: 0, notes: "Tampo inferior" },

    // Inspeção 2 - V-101 (EM_ANDAMENTO)
    { inspectionId: "insp-002", point: "P1", thicknessMm: 11.6, angleDeg: 0, notes: "Casco - região superior" },
    { inspectionId: "insp-002", point: "P2", thicknessMm: 11.9, angleDeg: 45, notes: "Casco - região média" },
    { inspectionId: "insp-002", point: "P3", thicknessMm: 8.5, angleDeg: 90, notes: "Casco - região inferior - ATENÇÃO" },

    // Inspeção 3 - C-201 (AGUARDANDO_APROVACAO)
    { inspectionId: "insp-003", point: "T1", thicknessMm: 15.2, angleDeg: 0, notes: "Tubo fogo - fileira 1" },
    { inspectionId: "insp-003", point: "T2", thicknessMm: 14.8, angleDeg: 0, notes: "Tubo fogo - fileira 2" },
    { inspectionId: "insp-003", point: "T3", thicknessMm: 15.5, angleDeg: 0, notes: "Tubo fogo - fileira 3" },
    { inspectionId: "insp-003", point: "C1", thicknessMm: 15.8, angleDeg: 0, notes: "Câmara de combustão" },

    // Inspeção 4 - T-301 (APROVADA)
    { inspectionId: "insp-004", point: "A1", thicknessMm: 5.8, angleDeg: 0, notes: "Anel inferior - chapa 1" },
    { inspectionId: "insp-004", point: "A2", thicknessMm: 5.9, angleDeg: 90, notes: "Anel inferior - chapa 2" },
    { inspectionId: "insp-004", point: "B1", thicknessMm: 5.7, angleDeg: 0, notes: "Anel médio - chapa 1" },
    { inspectionId: "insp-004", point: "B2", thicknessMm: 5.8, angleDeg: 90, notes: "Anel médio - chapa 2" },
    { inspectionId: "insp-004", point: "C1", thicknessMm: 5.6, angleDeg: 0, notes: "Anel superior - chapa 1" },

    // Inspeção 5 - V-401 (REJEITADA)
    { inspectionId: "insp-005", point: "P1", thicknessMm: 7.8, angleDeg: 0, notes: "Casco - região superior" },
    { inspectionId: "insp-005", point: "P2", thicknessMm: 7.5, angleDeg: 45, notes: "Casco - região média" },
    { inspectionId: "insp-005", point: "P3", thicknessMm: 4.2, angleDeg: 90, notes: "Casco - região inferior - CRÍTICO (< 5.5mm)" },

    // Inspeção 6 - TC-501 (EM_ANDAMENTO)
    { inspectionId: "insp-006", point: "S1", thicknessMm: 9.2, angleDeg: 0, notes: "Casco lado casco" },
    { inspectionId: "insp-006", point: "S2", thicknessMm: 9.1, angleDeg: 0, notes: "Casco lado tubo" },
    { inspectionId: "insp-006", point: "T1", thicknessMm: 2.8, angleDeg: 0, notes: "Tubo 1 - parede fina esperada" },
    { inspectionId: "insp-006", point: "T2", thicknessMm: 2.9, angleDeg: 0, notes: "Tubo 2" },
  ];

  for (const m of measurements) {
    await prisma.inspectionMeasurement.create({ data: m as any });
  }

  console.log("✅ Medições criadas");

  // ================================================================
  // 6. TEMPLATES DE TEXTO (biblioteca de recomendações)
  // ================================================================
  const templates = [
    {
      code: "REC_12_1",
      title: "12.1 - Inspeção visual anual",
      content: "Recomenda-se a realização de inspeção visual anual no equipamento, conforme NR-13, item 13.7.2, a fim de verificar a integridade externa e identificar possíveis danos mecânicos, corrosão, vazamentos ou deformações.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_2",
      title: "12.2 - Teste hidrostático periódico",
      content: "Recomenda-se a realização de teste hidrostático periódico a cada 5 (cinco) anos, ou conforme critério do profissional habilitado, visando verificar a resistência do equipamento à pressão de projeto.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_3",
      title: "12.3 - Substituição de válvula de segurança",
      content: "Recomenda-se a substituição da válvula de segurança a cada 3 (três) anos ou conforme recomendação do fabricante, garantindo o funcionamento adequado do dispositivo de alívio de pressão.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_4",
      title: "12.4 - Calibração de instrumentos",
      content: "Recomenda-se a calibração anual de manômetros, pressostatos e instrumentos de medição utilizados no equipamento, por laboratório acreditado pelo INMETRO.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_5",
      title: "12.5 - Inspeção de soldas",
      content: "Recomenda-se a realização de inspeção visual e, se aplicável, ensaio não destrutivo (END) nas soldas do equipamento a cada inspeção periódica, visando identificar trincas, poros ou defeitos de fabricação.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_6",
      title: "12.6 - Proteção contra corrosão",
      content: "Recomenda-se a manutenção do sistema de proteção contra corrosão (pintura, revestimento ou proteção catódica), com retoques ou reaplicação conforme necessário, a fim de preservar a integridade do material.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_7",
      title: "12.7 - Treinamento de operadores",
      content: "Recomenda-se a capacitação e treinamento periódico dos operadores responsáveis pela operação e monitoramento do equipamento, conforme exigência da NR-13, item 13.3.4.",
      category: "RECOMENDACAO",
    },
    {
      code: "REC_12_8",
      title: "12.8 - Registro de manutenções",
      content: "Recomenda-se a manutenção de registro atualizado de todas as manutenções, inspeções, reparos e alterações realizadas no equipamento, arquivados por período mínimo de 10 (dez) anos.",
      category: "RECOMENDACAO",
    },
    {
      code: "AVISO_REPARO",
      title: "Aviso de Reparo/Alteração",
      content: "A empresa {cliente} deve informar a ENGSERV-ENGENHARIA E SERVIÇOS, junto ao Profissional Legalmente Habilitado sempre que for executar qualquer reparo ou alteração que venha a comprometer a segurança do vaso de pressão, meio ambiente e colaboradores.",
      category: "AVISO_REPARO",
    },
    {
      code: "CLASSIFICACAO_TEXTO",
      title: "Texto de Classificação NR-13",
      content: "Os vasos de pressão são classificados em categorias segundo o tipo de fluído e o potencial em função do produto P.V onde P é a pressão máxima de operação em Mpa e V é o volume geométrico interno em m³ (Item 13.5.1.2).",
      category: "CLASSIFICACAO",
    },
    {
      code: "CONCLUSAO_PADRAO",
      title: "Conclusão Padrão",
      content: "Conforme Norma ABNT NBR 15417 e NR-13 conclui-se que o Vaso de Pressão {tipo_equipamento} TAG:{tag} encontra-se APTO para prosseguir em operação até a data da próxima inspeção de acordo com item {item_referencia} deste documento desde que as exigências de melhorias e recomendações escritas no item 12 deste documento sejam todas atendidas.",
      category: "CONCLUSAO",
    },
  ];

  for (const t of templates) {
    await prisma.textTemplate.upsert({
      where: { code: t.code },
      update: { ...t, active: true },
      create: { ...t, active: true },
    });
  }

  console.log("✅ Templates de texto criados");

  // ================================================================
  // 7. FOTOS DE INSPEÇÃO (placeholder URLs)
  // ================================================================
  const photos = [
    { inspectionId: "insp-001", url: "https://images.unsplash.com/photo-1581092921461-9f0e8b2b1b5e?w=800", category: "VISTA_GERAL", caption: "Visão geral do vaso V-101", order: 0, uploadedById: inspetor1.id },
    { inspectionId: "insp-001", url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800", category: "PLACA", caption: "Placa de identificação", order: 1, uploadedById: inspetor1.id },
    { inspectionId: "insp-001", url: "https://images.unsplash.com/photo-1581092195165-2144b8b5e6f0?w=800", category: "ULTRASSOM", caption: "Pontos de medição ultrassom", order: 2, uploadedById: inspetor1.id },
    { inspectionId: "insp-003", url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800", category: "VISTA_GERAL", caption: "Caldeira C-201 - vista geral", order: 0, uploadedById: inspetor1.id },
    { inspectionId: "insp-004", url: "https://images.unsplash.com/photo-1581093588401-8e5b5b7b8c9a?w=800", category: "VISTA_GERAL", caption: "Tanque T-301 - armazenamento diesel", order: 0, uploadedById: inspetor2.id },
    { inspectionId: "insp-005", url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800", category: "CORROSAO", caption: "Corrosão severa no ponto P3", order: 0, uploadedById: inspetor1.id },
  ];

  for (const p of photos) {
    try {
      await prisma.inspectionPhoto.create({ data: p as any });
    } catch (e: any) {
      if (e.code !== "P2002") throw e;
    }
  }

  console.log("✅ Fotos de inspeção criadas");

  console.log("\n🎉 Seed de demonstração concluído com sucesso!");
  console.log("\n📋 Credenciais de acesso:");
  console.log("   Admin Master: admin@engeserv.com.br / demo123");
  console.log("   Gestor:       gestor@engeserv.com.br / demo123");
  console.log("   Inspetor 1:   inspetor1@engeserv.com.br / demo123");
  console.log("   Inspetor 2:   inspetor2@engeserv.com.br / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });