import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Use DIRECT_URL for direct database operations (bypass pooler)
function getDirectDbUrl(): string {
  // Prefer DIRECT_URL for seeding (bypasses Supabase pooler)
  if (process.env.DIRECT_URL) {
    return process.env.DIRECT_URL;
  }
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
  // 2. Funnel Stages (7 ingresso stages) — Novo funil webinar
  // ============================
  const stages = [
    { name: 'Lead', position: 1, description: 'Se inscreveu no webinar', source: 'AUTO' as const },
    { name: 'Participou', position: 2, description: 'Assistiu ao webinar (ao vivo ou replay)', source: 'AUTO' as const },
    { name: 'Visitou Sede', position: 3, description: 'Foi a reunião presencial na sede', source: 'MANUAL' as const },
    { name: 'Curso de Informação', position: 4, description: 'Participou do curso de informação', source: 'MANUAL' as const },
    { name: 'Curso de Preparação', position: 5, description: 'Participou do curso de preparação', source: 'MANUAL' as const },
    { name: 'Ingressou', position: 6, description: 'Membro efetivo da Fundação Logosófica', source: 'MANUAL' as const },
    { name: 'Desistiu', position: 7, description: 'Desistiu do processo em qualquer etapa', source: 'MANUAL' as const },
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
  // 5. Sample Leads across all stages — Novo funil webinar
  // ============================
  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    const leadNames = [
      // Stage 1 - Lead (inscrito no webinar)
      { name: 'Ana Carolina', stage: 1, channel: 'Instagram', lifeMoment: 'autoconhecimento', inquiry: 'Sinto que preciso de algo mais profundo', utm: { source: 'meta', medium: 'cpc', campaign: 'webinar-abril-2026' } },
      { name: 'Bruno Martins', stage: 1, channel: 'TikTok', lifeMoment: 'transicao_carreira', inquiry: 'Mudança de vida', utm: { source: 'tiktok', medium: 'organic', campaign: 'webinar-abril-2026' } },
      { name: 'Camila Ferreira', stage: 1, channel: 'Instagram', utm: { source: 'meta', medium: 'cpc', campaign: 'webinar-abril-2026' } },
      { name: 'Diego Souza', stage: 1, channel: 'Instagram' },
      { name: 'Eduarda Lima', stage: 1, channel: 'YouTube' },
      // Stage 2 - Participou (assistiu ao webinar)
      { name: 'Fernanda Oliveira', stage: 2, channel: 'Instagram', email: 'fernanda.o@email.com', lifeMoment: 'busca_espiritual', inquiry: 'Procurando propósito na vida', utm: { source: 'meta', medium: 'cpc', campaign: 'webinar-abril-2026' } },
      { name: 'Gabriel Santos', stage: 2, channel: 'TikTok', email: 'gabriel.s@email.com', phone: '(48) 99123-4567' },
      { name: 'Helena Costa', stage: 2, channel: 'Instagram', email: 'helena.c@email.com' },
      // Stage 3 - Visitou Sede (foi à reunião presencial)
      { name: 'Igor Mendes', stage: 3, channel: 'Instagram', email: 'igor.m@email.com', phone: '(48) 99234-5678', lifeMoment: 'paternidade', inquiry: 'Como educar meus filhos com valores', utm: { source: 'meta', medium: 'cpc', campaign: 'webinar-abril-2026' } },
      { name: 'Julia Ribeiro', stage: 3, channel: 'YouTube', email: 'julia.r@email.com', phone: '(48) 99345-6789', lifeMoment: 'autoconhecimento' },
      // Stage 4 - Curso de Informação
      { name: 'Kevin Almeida', stage: 4, channel: 'Instagram', email: 'kevin.a@email.com', phone: '(48) 99456-7890', lifeMoment: 'busca_espiritual', inquiry: 'Conhecimento que transforma' },
      // Stage 5 - Curso de Preparação
      { name: 'Larissa Duarte', stage: 5, channel: 'Instagram', email: 'larissa.d@email.com', phone: '(48) 99567-8901', lifeMoment: 'transicao_carreira' },
      // Stage 6 - Ingressou
      { name: 'Marcos Vieira', stage: 6, channel: 'TikTok', email: 'marcos.v@email.com', phone: '(48) 99678-9012', lifeMoment: 'busca_espiritual', inquiry: 'Encontrei o que buscava' },
      // Stage 7 - Desistiu
      { name: 'Natália Prado', stage: 7, channel: 'Instagram', email: 'natalia.p@email.com', phone: '(48) 99789-0123', lifeMoment: 'crise_pessoal' },
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
          utmSource: lead.utm?.source || null,
          utmMedium: lead.utm?.medium || null,
          utmCampaign: lead.utm?.campaign || null,
        },
      });
    }

    // Create lead events (stage transitions) for leads that advanced past stage 2
    const advancedLeads = await prisma.lead.findMany({
      where: { currentStage: { position: { gte: 3 } }, isDeleted: false },
    });

    for (const lead of advancedLeads) {
      const stagePos = stages.findIndex(s => `stage-${s.position}` === lead.currentStageId);
      if (stagePos <= 0) continue;

      // Create transition events from stage 1 up to current stage
      for (let i = 0; i < stagePos; i++) {
        const daysAgo = (stagePos - i) * 14 + Math.floor(Math.random() * 7);
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() - daysAgo);

        await prisma.leadEvent.create({
          data: {
            leadId: lead.id,
            fromStageId: `stage-${i + 1}`,
            toStageId: `stage-${i + 2}`,
            createdById: i % 2 === 0 ? adminUser.id : editorUser.id,
            createdAt: eventDate,
            notes: i === stagePos - 1 ? 'Avançou após acompanhamento do SIPE' : null,
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
