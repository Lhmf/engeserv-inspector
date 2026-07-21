import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed TextTemplate with the 8 recommendations from LAUDO_TEMPLATE_STRUCTURE.md
  const recommendations = [
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
  ];

  for (const rec of recommendations) {
    await prisma.textTemplate.upsert({
      where: { code: rec.code },
      update: { ...rec, active: true },
      create: { ...rec, active: true },
    });
    console.log(`Seeded: ${rec.code} - ${rec.title}`);
  }

  console.log("TextTemplate seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });