import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stages = [
    { name: 'Alcance', position: 1, description: 'Impressões e views nas redes sociais', source: 'AUTO' as const },
    { name: 'Engajamento', position: 2, description: 'Likes, comentários, shares, saves', source: 'AUTO' as const },
    { name: 'Interesse', position: 3, description: 'Cliques em links, visitas ao perfil, DMs', source: 'AUTO' as const },
    { name: 'Consideração', position: 4, description: 'Cadastro em webinar ou conteúdo especial', source: 'MANUAL' as const },
    { name: 'Conversão', position: 5, description: 'Comparecimento à reunião presencial', source: 'MANUAL' as const },
    { name: 'Retenção', position: 6, description: 'Retorno e fidelização como membro', source: 'MANUAL' as const },
  ];

  for (const stage of stages) {
    await prisma.funnelStage.upsert({
      where: { id: `stage-${stage.position}` },
      update: stage,
      create: { id: `stage-${stage.position}`, ...stage },
    });
  }

  console.log('Seed complete: 6 funnel stages created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
