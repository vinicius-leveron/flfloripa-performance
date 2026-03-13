import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Extract direct postgres URL from prisma+postgres proxy URL
function getDirectDbUrl(): string {
  const url = process.env.DATABASE_URL!;
  if (url.startsWith('prisma+postgres://')) {
    const apiKey = url.split('api_key=')[1];
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
      return decoded.databaseUrl;
    }
  }
  return url;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: getDirectDbUrl() }),
});

async function main() {
  // ============================
  // 1. Initial Admin User
  // ============================
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'demo@logosofia.org.br' },
    update: { name: 'Vinícius', role: 'ADMIN', passwordHash },
    create: {
      id: 'user-demo',
      email: 'demo@logosofia.org.br',
      name: 'Vinícius',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'marcos@logosofia.org.br' },
    update: { name: 'Marcos', role: 'EDITOR' },
    create: {
      id: 'user-marcos',
      email: 'marcos@logosofia.org.br',
      name: 'Marcos',
      role: 'EDITOR',
    },
  });

  console.log('✓ Users created (admin: demo@logosofia.org.br / demo1234)');

  // ============================
  // 2. Funnel Stages (7 ingresso stages)
  // ============================
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
  console.log('✓ 7 funnel stages created');

  // ============================
  // 3. Channels
  // ============================
  const channelData = [
    { id: 'ch-ig', platform: 'INSTAGRAM' as const, accountName: '@flfloripa', accountId: 'ig-flfloripa' },
    { id: 'ch-tt', platform: 'TIKTOK' as const, accountName: '@flfloripa', accountId: 'tt-flfloripa' },
    { id: 'ch-yt', platform: 'YOUTUBE' as const, accountName: 'FL Floripa', accountId: 'yt-flfloripa' },
  ];

  for (const ch of channelData) {
    await prisma.channel.upsert({
      where: { id: ch.id },
      update: {},
      create: {
        id: ch.id,
        platform: ch.platform,
        accountName: ch.accountName,
        accountId: ch.accountId,
        accessToken: '',
        status: 'DISCONNECTED',
        userId: adminUser.id,
      },
    });
  }
  console.log('✓ 3 channels created (DISCONNECTED — connect via OAuth)');

  // ============================
  // 4. Metrics (last 30 days per channel)
  // ============================
  const existingMetrics = await prisma.metric.count();
  if (existingMetrics === 0) {
    const now = new Date();
    const metricsData = [];

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      for (const ch of channelData) {
        const baseImpressions = ch.platform === 'INSTAGRAM' ? 3000 : ch.platform === 'TIKTOK' ? 5000 : 1500;
        const variance = () => 0.7 + Math.random() * 0.6;
        const impressions = Math.round(baseImpressions * variance());
        const reach = Math.round(impressions * (0.6 + Math.random() * 0.2));
        const engagement = Math.round(impressions * (0.03 + Math.random() * 0.04));

        metricsData.push({
          channelId: ch.id,
          date,
          impressions,
          reach,
          engagement,
          profileVisits: Math.round(engagement * (0.2 + Math.random() * 0.3)),
          linkClicks: Math.round(engagement * (0.1 + Math.random() * 0.15)),
          followersCount: ch.platform === 'INSTAGRAM' ? 4200 + dayOffset * 3
            : ch.platform === 'TIKTOK' ? 2800 + dayOffset * 5
            : 950 + dayOffset,
        });
      }
    }

    await prisma.metric.createMany({ data: metricsData });
    console.log(`✓ ${metricsData.length} metric records created`);
  }

  // ============================
  // 5. Sample Leads across all stages
  // ============================
  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    const leadNames = [
      // Stage 1 - Impactado (12 leads)
      { name: 'Ana Carolina', stage: 1, channel: 'Instagram', lifeMoment: 'autoconhecimento', inquiry: 'Sinto que preciso de algo mais profundo', adSpend: 12.50, utm: { source: 'meta', medium: 'cpc', campaign: 'vsl-marco-2026' }, vslWatched: false },
      { name: 'Bruno Martins', stage: 1, channel: 'TikTok', lifeMoment: 'transicao_carreira', inquiry: 'Mudança de vida', adSpend: 8.30, utm: { source: 'tiktok', medium: 'cpc', campaign: 'carrossel-depoimentos' }, vslWatched: false },
      { name: 'Camila Ferreira', stage: 1, channel: 'Instagram', adSpend: 11.20, vslWatched: false },
      { name: 'Diego Souza', stage: 1, channel: 'Instagram', adSpend: 9.80, vslWatched: false },
      { name: 'Eduarda Lima', stage: 1, channel: 'TikTok', adSpend: 7.60, vslWatched: false },
      { name: 'Fernando Alves', stage: 1, channel: 'YouTube', adSpend: 15.00, vslWatched: false },
      { name: 'Gabriela Costa', stage: 1, channel: 'Instagram', adSpend: 10.40, vslWatched: false },
      { name: 'Hugo Pereira', stage: 1, channel: 'TikTok', adSpend: 6.90, vslWatched: false },
      { name: 'Isabela Rocha', stage: 1, channel: 'Instagram', adSpend: 13.10, vslWatched: false },
      { name: 'João Ribeiro', stage: 1, channel: 'YouTube', adSpend: 14.50, vslWatched: false },
      { name: 'Karen Oliveira', stage: 1, channel: 'Instagram', adSpend: 11.80, vslWatched: false },
      { name: 'Lucas Cardoso', stage: 1, channel: 'TikTok', adSpend: 7.20, vslWatched: false },
      // Stage 2 - Visitou VSL (8 leads)
      { name: 'Mariana Silva', stage: 2, channel: 'Instagram', lifeMoment: 'busca_espiritual', inquiry: 'Procurando propósito na vida', adSpend: 12.00, vslWatched: true, vslWatchTime: 240, utm: { source: 'meta', medium: 'cpc', campaign: 'vsl-marco-2026' } },
      { name: 'Nicolas Santos', stage: 2, channel: 'TikTok', adSpend: 9.50, vslWatched: true, vslWatchTime: 180 },
      { name: 'Olivia Nascimento', stage: 2, channel: 'Instagram', adSpend: 11.00, vslWatched: true, vslWatchTime: 320 },
      { name: 'Pedro Henrique', stage: 2, channel: 'Instagram', adSpend: 13.50, vslWatched: true, vslWatchTime: 150 },
      { name: 'Rafaela Mendes', stage: 2, channel: 'YouTube', adSpend: 16.00, vslWatched: true, vslWatchTime: 410 },
      { name: 'Samuel Barbosa', stage: 2, channel: 'TikTok', adSpend: 8.00, vslWatched: true, vslWatchTime: 90 },
      { name: 'Tatiana Campos', stage: 2, channel: 'Instagram', adSpend: 10.80, vslWatched: true, vslWatchTime: 280 },
      { name: 'Ulisses Prado', stage: 2, channel: 'Instagram', adSpend: 12.30, vslWatched: true, vslWatchTime: 200 },
      // Stage 3 - Inscrito Atividade (5 leads)
      { name: 'Vanessa Duarte', stage: 3, channel: 'Instagram', email: 'vanessa.d@email.com', phone: '(48) 99123-4567', lifeMoment: 'paternidade', inquiry: 'Como educar meus filhos com valores', adSpend: 14.00, vslWatched: true, vslWatchTime: 450, utm: { source: 'meta', medium: 'cpc', campaign: 'vsl-marco-2026' } },
      { name: 'Wagner Moreira', stage: 3, channel: 'TikTok', email: 'wagner.m@email.com', phone: '(48) 99234-5678', lifeMoment: 'autoconhecimento', adSpend: 9.00, vslWatched: true, vslWatchTime: 360 },
      { name: 'Ximena Castro', stage: 3, channel: 'Instagram', email: 'ximena.c@email.com', lifeMoment: 'busca_espiritual', adSpend: 11.50, vslWatched: true, vslWatchTime: 300 },
      { name: 'Yuri Lopes', stage: 3, channel: 'Instagram', email: 'yuri.l@email.com', phone: '(48) 99345-6789', adSpend: 13.20, vslWatched: true, vslWatchTime: 420 },
      { name: 'Zélia Andrade', stage: 3, channel: 'YouTube', email: 'zelia.a@email.com', lifeMoment: 'crise_pessoal', inquiry: 'Superação de momento difícil', adSpend: 17.00, vslWatched: true, vslWatchTime: 500 },
      // Stage 4 - Participou Online (3 leads)
      { name: 'Amanda Teixeira', stage: 4, channel: 'Instagram', email: 'amanda.t@email.com', phone: '(48) 99456-7890', lifeMoment: 'relacionamento', inquiry: 'Melhorar meu relacionamento', adSpend: 12.00, vslWatched: true, vslWatchTime: 480 },
      { name: 'Bernardo Figueiredo', stage: 4, channel: 'TikTok', email: 'bernardo.f@email.com', phone: '(48) 99567-8901', lifeMoment: 'transicao_carreira', inquiry: 'Quero encontrar minha vocação', adSpend: 10.00, vslWatched: true, vslWatchTime: 400 },
      { name: 'Clara Monteiro', stage: 4, channel: 'Instagram', email: 'clara.m@email.com', lifeMoment: 'autoconhecimento', adSpend: 14.50, vslWatched: true, vslWatchTime: 520 },
      // Stage 5 - Participou Presencial (2 leads)
      { name: 'Daniela Rezende', stage: 5, channel: 'Instagram', email: 'daniela.r@email.com', phone: '(48) 99678-9012', lifeMoment: 'busca_espiritual', inquiry: 'Conhecimento que transforma', adSpend: 13.00, vslWatched: true, vslWatchTime: 480 },
      { name: 'Emanuel Cruz', stage: 5, channel: 'YouTube', email: 'emanuel.c@email.com', phone: '(48) 99789-0123', lifeMoment: 'paternidade', inquiry: 'Educação dos filhos', adSpend: 18.00, vslWatched: true, vslWatchTime: 550 },
      // Stage 6 - Pedido de Curso (1 lead)
      { name: 'Fernanda Araújo', stage: 6, channel: 'Instagram', email: 'fernanda.a@email.com', phone: '(48) 99890-1234', lifeMoment: 'autoconhecimento', inquiry: 'Quero me conhecer profundamente', adSpend: 15.00, vslWatched: true, vslWatchTime: 500 },
      // Stage 7 - Ingressou (2 leads)
      { name: 'Gabriel Nogueira', stage: 7, channel: 'Instagram', email: 'gabriel.n@email.com', phone: '(48) 99901-2345', lifeMoment: 'busca_espiritual', inquiry: 'Encontrei o que buscava', adSpend: 12.50, vslWatched: true, vslWatchTime: 480 },
      { name: 'Helena Vieira', stage: 7, channel: 'TikTok', email: 'helena.v@email.com', phone: '(48) 99012-3456', lifeMoment: 'crise_pessoal', inquiry: 'Transformação pessoal', adSpend: 11.00, vslWatched: true, vslWatchTime: 510 },
    ];

    for (const lead of leadNames) {
      await prisma.lead.create({
        data: {
          name: lead.name,
          email: lead.email || null,
          phone: lead.phone || null,
          channelOrigin: lead.channel,
          currentStageId: `stage-${lead.stage}`,
          registeredById: adminUser.id,
          lifeMoment: lead.lifeMoment || null,
          inquiry: lead.inquiry || null,
          source: lead.utm?.campaign || null,
          adSpend: lead.adSpend || null,
          utmSource: lead.utm?.source || null,
          utmMedium: lead.utm?.medium || null,
          utmCampaign: lead.utm?.campaign || null,
          vslWatched: lead.vslWatched ?? false,
          vslWatchTime: lead.vslWatchTime || null,
        },
      });
    }

    // Create lead events (stage transitions) for advanced leads
    const advancedLeads = await prisma.lead.findMany({
      where: { currentStage: { position: { gte: 4 } }, isDeleted: false },
    });

    for (const lead of advancedLeads) {
      const stagePos = stages.findIndex(s => `stage-${s.position}` === lead.currentStageId);
      if (stagePos <= 0) continue;

      for (let i = 0; i < stagePos; i++) {
        const daysAgo = (stagePos - i) * 7 + Math.floor(Math.random() * 5);
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - daysAgo);

        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            fromStageId: `stage-${i + 1}`,
            toStageId: `stage-${i + 2}`,
            createdById: i % 2 === 0 ? adminUser.id : editorUser.id,
            createdAt: eventDate,
            notes: i === stagePos - 1 ? 'Avançou após acompanhamento' : null,
          },
        });
      }
    }

    console.log(`✓ ${leadNames.length} leads + events created`);
  }

  // ============================
  // 6. Calendar Entries (this week + next week)
  // ============================
  const existingEntries = await prisma.contentCalendarEntry.count();
  if (existingEntries === 0) {
    const today = new Date();
    const calendarEntries = [
      { title: 'Reel — Depoimento aluno', channelId: 'ch-ig', category: 'TESTIMONY' as const, contentTheme: 'EXPERIENCIA' as const, contentFormat: 'REEL' as const, daysOffset: 0 },
      { title: 'Post — Frase de González Pecotche', channelId: 'ch-ig', category: 'EDUCATIONAL' as const, contentTheme: 'ENSINAMENTO' as const, contentFormat: 'FEED_POST' as const, daysOffset: 1 },
      { title: 'Story — Bastidores atividade', channelId: 'ch-ig', category: 'INSTITUTIONAL' as const, contentTheme: 'DIVULGACAO' as const, contentFormat: 'STORY' as const, daysOffset: 1 },
      { title: 'TikTok — Dica de leitura', channelId: 'ch-tt', category: 'EDUCATIONAL' as const, contentTheme: 'DICA_LEITURA' as const, contentFormat: 'REEL' as const, daysOffset: 2 },
      { title: 'Post — Convite atividade online', channelId: 'ch-ig', category: 'INVITE' as const, contentTheme: 'CONVITE' as const, contentFormat: 'FEED_POST' as const, daysOffset: 3 },
      { title: 'Reforço — Lembrete atividade sábado', channelId: 'ch-ig', category: 'INVITE' as const, contentTheme: 'REFORCO_CONVITE' as const, contentFormat: 'STORY' as const, daysOffset: 4 },
      { title: 'YouTube — Palestra completa', channelId: 'ch-yt', category: 'EDUCATIONAL' as const, contentTheme: 'ENSINAMENTO' as const, contentFormat: 'VIDEO_LONGO' as const, daysOffset: 5 },
      { title: 'TikTok — Trecho de palestra', channelId: 'ch-tt', category: 'EDUCATIONAL' as const, contentTheme: 'PODCAST' as const, contentFormat: 'REEL' as const, daysOffset: 5 },
      { title: 'Post — Reflexão semanal', channelId: 'ch-ig', category: 'EDUCATIONAL' as const, contentTheme: 'ENSINAMENTO' as const, contentFormat: 'FEED_POST' as const, daysOffset: 7 },
      { title: 'Reel — Antes e depois aluno', channelId: 'ch-ig', category: 'TESTIMONY' as const, contentTheme: 'EXPERIENCIA' as const, contentFormat: 'REEL' as const, daysOffset: 8 },
      { title: 'Post — Convite atividade presencial', channelId: 'ch-ig', category: 'INVITE' as const, contentTheme: 'CONVITE' as const, contentFormat: 'FEED_POST' as const, daysOffset: 9 },
      { title: 'TikTok — Pergunta do dia', channelId: 'ch-tt', category: 'INSTITUTIONAL' as const, contentTheme: 'OUTRO' as const, contentFormat: 'REEL' as const, daysOffset: 10 },
    ];

    for (const entry of calendarEntries) {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + entry.daysOffset);
      scheduledDate.setHours(0, 0, 0, 0);

      await prisma.contentCalendarEntry.create({
        data: {
          title: entry.title,
          channelId: entry.channelId,
          category: entry.category,
          contentTheme: entry.contentTheme,
          contentFormat: entry.contentFormat,
          assigneeId: entry.daysOffset % 3 === 0 ? editorUser.id : adminUser.id,
          status: entry.daysOffset <= 0 ? 'PUBLISHED' : entry.daysOffset <= 2 ? 'CREATED' : 'PLANNED',
          scheduledDate,
        },
      });
    }
    console.log(`✓ ${calendarEntries.length} calendar entries created`);
  }

  // ============================
  // 7. Cadence Goals
  // ============================
  const cadenceGoals = [
    { platform: 'INSTAGRAM' as const, postsPerWeek: 5 },
    { platform: 'TIKTOK' as const, postsPerWeek: 3 },
    { platform: 'LINKEDIN' as const, postsPerWeek: 2 },
    { platform: 'YOUTUBE' as const, postsPerWeek: 1 },
  ];

  for (const goal of cadenceGoals) {
    await prisma.cadenceGoal.upsert({
      where: { platform: goal.platform },
      update: goal,
      create: goal,
    });
  }

  // ============================
  // 8. Alert Thresholds
  // ============================
  const thresholds = [
    { metricName: 'engagement', dropPercentage: 20 },
    { metricName: 'reach', dropPercentage: 30 },
    { metricName: 'impressions', dropPercentage: 25 },
  ];

  for (const t of thresholds) {
    await prisma.alertThreshold.upsert({
      where: { metricName: t.metricName },
      update: t,
      create: t,
    });
  }

  console.log('✓ Cadence goals + alert thresholds created');

  // ============================
  // 9. Campaigns + Campaign Metrics
  // ============================
  const existingCampaigns = await prisma.campaign.count();
  if (existingCampaigns === 0) {
    const campaignsData = [
      { id: 'camp-1', metaCampaignId: 'meta-vsl-marco-2026', channelId: 'ch-ig', name: 'VSL Marco 2026', status: 'ACTIVE' as const, objective: 'CONVERSIONS', budget: 500, daysAgo: 30, daysAhead: 30 },
      { id: 'camp-2', metaCampaignId: 'meta-carrossel-depoimentos', channelId: 'ch-tt', name: 'Carrossel Depoimentos', status: 'ACTIVE' as const, objective: 'ENGAGEMENT', budget: 200, daysAgo: 14, daysAhead: 16 },
    ];

    for (const camp of campaignsData) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - camp.daysAgo);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + camp.daysAhead);

      await prisma.campaign.create({
        data: {
          id: camp.id,
          metaCampaignId: camp.metaCampaignId,
          channelId: camp.channelId,
          name: camp.name,
          status: camp.status,
          objective: camp.objective,
          budget: camp.budget,
          startDate,
          endDate,
        },
      });

      // Generate daily campaign metrics
      const metricsData = [];
      for (let dayOffset = camp.daysAgo; dayOffset >= 0; dayOffset--) {
        const date = new Date();
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);

        const dailyBudget = camp.budget / (camp.daysAgo + camp.daysAhead);
        const variance = () => 0.6 + Math.random() * 0.8;
        const spend = Math.round(dailyBudget * variance() * 100) / 100;
        const impressions = Math.round((camp.channelId === 'ch-ig' ? 1200 : 2000) * variance());
        const clicks = Math.round(impressions * (0.03 + Math.random() * 0.03));
        const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.03));

        metricsData.push({
          campaignId: camp.id,
          date,
          spend,
          impressions,
          clicks,
          cpm: impressions > 0 ? Math.round((spend / impressions) * 1000 * 100) / 100 : 0,
          cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
          ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
          conversions,
        });
      }

      await prisma.campaignMetric.createMany({ data: metricsData });
    }

    console.log('✓ 2 campaigns + daily metrics created');
  }

  // ============================
  // 10. Sample Alerts
  // ============================
  const existingAlerts = await prisma.alert.count();
  if (existingAlerts === 0) {
    await prisma.alert.createMany({
      data: [
        { type: 'ENGAGEMENT_DROP', channelId: 'ch-ig', message: 'Engajamento do Instagram caiu 15% esta semana', isRead: false },
        { type: 'CADENCE_MISS', channelId: 'ch-ig', message: 'Meta de 5 posts/semana no Instagram não atingida (3/5)', isRead: true },
      ],
    });
    console.log('✓ 2 sample alerts created');
  }

  console.log('\n✓ Seed complete! Login: demo@logosofia.org.br / demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
