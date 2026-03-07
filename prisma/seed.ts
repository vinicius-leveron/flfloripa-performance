import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 7 estágios do funil de ingresso logosófico
  const stages = [
    { name: 'Impactado', position: 1, description: 'Viu o criativo/anúncio nas redes sociais', source: 'AUTO' as const },
    { name: 'Visitou VSL', position: 2, description: 'Clicou e assistiu a VSL na landing page', source: 'AUTO' as const },
    { name: 'Inscrito Atividade', position: 3, description: 'Preencheu formulário para atividade online', source: 'MANUAL' as const },
    { name: 'Participou Online', position: 4, description: 'Compareceu à atividade online ao vivo', source: 'MANUAL' as const },
    { name: 'Participou Presencial', position: 5, description: 'Veio à atividade presencial na sede', source: 'MANUAL' as const },
    { name: 'Pedido de Curso', position: 6, description: 'Solicitou ingresso no curso de formação', source: 'MANUAL' as const },
    { name: 'Ingressou', position: 7, description: 'Efetivou ingresso na Fundação Logosófica', source: 'MANUAL' as const },
  ];

  for (const stage of stages) {
    await prisma.funnelStage.upsert({
      where: { id: `stage-${stage.position}` },
      update: stage,
      create: { id: `stage-${stage.position}`, ...stage },
    });
  }

  console.log('Seed complete: 7 funnel stages (funil de ingresso) created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
