// Demo mode: serves mock data when DATABASE_URL is not configured
// This allows the app to run on Vercel without any database setup

export const IS_DEMO = !process.env.DATABASE_URL;

export const DEMO_USER = {
  id: 'user-demo',
  email: 'demo@logosofia.org.br',
  name: 'Vinícius Demo',
  image: null,
  role: 'ADMIN' as const,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

// Generate dates relative to now
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================
// Funnel Stages
// ============================
export const DEMO_STAGES = [
  { id: 'stage-1', name: 'Impactado', position: 1, description: 'Viu o criativo/anúncio nas redes sociais', source: 'AUTO', leadCount: 12, conversionRate: 100 },
  { id: 'stage-2', name: 'Visitou VSL', position: 2, description: 'Clicou e assistiu a VSL na landing page', source: 'AUTO', leadCount: 8, conversionRate: 66.67 },
  { id: 'stage-3', name: 'Inscrito Atividade', position: 3, description: 'Preencheu formulário para atividade online', source: 'MANUAL', leadCount: 5, conversionRate: 62.5 },
  { id: 'stage-4', name: 'Participou Online', position: 4, description: 'Compareceu à atividade online ao vivo', source: 'MANUAL', leadCount: 3, conversionRate: 60 },
  { id: 'stage-5', name: 'Participou Presencial', position: 5, description: 'Veio à atividade presencial na sede', source: 'MANUAL', leadCount: 2, conversionRate: 66.67 },
  { id: 'stage-6', name: 'Pedido de Curso', position: 6, description: 'Solicitou ingresso no curso de formação', source: 'MANUAL', leadCount: 1, conversionRate: 50 },
  { id: 'stage-7', name: 'Ingressou', position: 7, description: 'Efetivou ingresso na Fundação Logosófica', source: 'MANUAL', leadCount: 2, conversionRate: 200 },
];

export const DEMO_FUNNEL_METRICS = {
  stages: DEMO_STAGES,
  metrics: {
    totalLeads: 33,
    totalIngressos: 2,
    overallConversionRate: 16.67,
    totalAdSpend: 385.40,
    costPerLead: 77.08,
    costPerIngresso: 192.70,
  },
  channelBreakdown: [
    { channel: 'Instagram', leads: 20, ingressos: 1, conversionRate: 5, adSpend: 245.60, costPerIngresso: 245.60 },
    { channel: 'TikTok', leads: 8, ingressos: 1, conversionRate: 12.5, adSpend: 76.80, costPerIngresso: 76.80 },
    { channel: 'YouTube', leads: 5, ingressos: 0, conversionRate: 0, adSpend: 63.00, costPerIngresso: 0 },
  ],
};

// ============================
// Leads
// ============================
export const DEMO_LEADS = [
  { id: 'lead-1', name: 'Ana Carolina', email: null, phone: null, channelOrigin: 'Instagram', currentStage: { id: 'stage-1', name: 'Impactado', position: 1 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'autoconhecimento', inquiry: 'Sinto que preciso de algo mais profundo', source: 'vsl-marco-2026', adSpend: 12.50, utmSource: 'meta', utmMedium: 'cpc', utmCampaign: 'vsl-marco-2026', vslWatched: false, vslWatchTime: null, notes: null, createdAt: daysAgo(5), events: [] },
  { id: 'lead-2', name: 'Bruno Martins', email: null, phone: null, channelOrigin: 'TikTok', currentStage: { id: 'stage-1', name: 'Impactado', position: 1 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'transicao_carreira', inquiry: 'Mudança de vida', source: 'carrossel-depoimentos', adSpend: 8.30, utmSource: 'tiktok', utmMedium: 'cpc', utmCampaign: 'carrossel-depoimentos', vslWatched: false, vslWatchTime: null, notes: null, createdAt: daysAgo(4), events: [] },
  { id: 'lead-3', name: 'Camila Ferreira', email: null, phone: null, channelOrigin: 'Instagram', currentStage: { id: 'stage-1', name: 'Impactado', position: 1 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: null, inquiry: null, source: null, adSpend: 11.20, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: false, vslWatchTime: null, notes: null, createdAt: daysAgo(3), events: [] },
  { id: 'lead-13', name: 'Mariana Silva', email: null, phone: null, channelOrigin: 'Instagram', currentStage: { id: 'stage-2', name: 'Visitou VSL', position: 2 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'busca_espiritual', inquiry: 'Procurando propósito na vida', source: 'vsl-marco-2026', adSpend: 12.00, utmSource: 'meta', utmMedium: 'cpc', utmCampaign: 'vsl-marco-2026', vslWatched: true, vslWatchTime: 240, notes: null, createdAt: daysAgo(8), events: [] },
  { id: 'lead-14', name: 'Nicolas Santos', email: null, phone: null, channelOrigin: 'TikTok', currentStage: { id: 'stage-2', name: 'Visitou VSL', position: 2 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: null, inquiry: null, source: null, adSpend: 9.50, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: true, vslWatchTime: 180, notes: null, createdAt: daysAgo(7), events: [] },
  { id: 'lead-21', name: 'Vanessa Duarte', email: 'vanessa.d@email.com', phone: '(48) 99123-4567', channelOrigin: 'Instagram', currentStage: { id: 'stage-3', name: 'Inscrito Atividade', position: 3 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'paternidade', inquiry: 'Como educar meus filhos com valores', source: 'vsl-marco-2026', adSpend: 14.00, utmSource: 'meta', utmMedium: 'cpc', utmCampaign: 'vsl-marco-2026', vslWatched: true, vslWatchTime: 450, notes: null, createdAt: daysAgo(14), events: [{ id: 'ev-1', createdAt: daysAgo(10), notes: null, fromStage: { name: 'Impactado' }, toStage: { name: 'Visitou VSL' }, createdBy: { name: 'Vinícius Demo' } }, { id: 'ev-2', createdAt: daysAgo(8), notes: 'Assistiu VSL completa', fromStage: { name: 'Visitou VSL' }, toStage: { name: 'Inscrito Atividade' }, createdBy: { name: 'Marcos' } }] },
  { id: 'lead-26', name: 'Amanda Teixeira', email: 'amanda.t@email.com', phone: '(48) 99456-7890', channelOrigin: 'Instagram', currentStage: { id: 'stage-4', name: 'Participou Online', position: 4 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'relacionamento', inquiry: 'Melhorar meu relacionamento', source: null, adSpend: 12.00, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: true, vslWatchTime: 480, notes: null, createdAt: daysAgo(21), events: [{ id: 'ev-3', createdAt: daysAgo(18), notes: null, fromStage: { name: 'Impactado' }, toStage: { name: 'Visitou VSL' }, createdBy: { name: 'Vinícius Demo' } }, { id: 'ev-4', createdAt: daysAgo(15), notes: null, fromStage: { name: 'Visitou VSL' }, toStage: { name: 'Inscrito Atividade' }, createdBy: { name: 'Marcos' } }, { id: 'ev-5', createdAt: daysAgo(10), notes: 'Avançou após acompanhamento', fromStage: { name: 'Inscrito Atividade' }, toStage: { name: 'Participou Online' }, createdBy: { name: 'Vinícius Demo' } }] },
  { id: 'lead-29', name: 'Daniela Rezende', email: 'daniela.r@email.com', phone: '(48) 99678-9012', channelOrigin: 'Instagram', currentStage: { id: 'stage-5', name: 'Participou Presencial', position: 5 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'busca_espiritual', inquiry: 'Conhecimento que transforma', source: null, adSpend: 13.00, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: true, vslWatchTime: 480, notes: null, createdAt: daysAgo(28), events: [{ id: 'ev-6', createdAt: daysAgo(25), notes: null, fromStage: { name: 'Impactado' }, toStage: { name: 'Visitou VSL' }, createdBy: { name: 'Vinícius Demo' } }, { id: 'ev-7', createdAt: daysAgo(21), notes: null, fromStage: { name: 'Visitou VSL' }, toStage: { name: 'Inscrito Atividade' }, createdBy: { name: 'Marcos' } }, { id: 'ev-8', createdAt: daysAgo(17), notes: null, fromStage: { name: 'Inscrito Atividade' }, toStage: { name: 'Participou Online' }, createdBy: { name: 'Vinícius Demo' } }, { id: 'ev-9', createdAt: daysAgo(10), notes: 'Veio à sede', fromStage: { name: 'Participou Online' }, toStage: { name: 'Participou Presencial' }, createdBy: { name: 'Marcos' } }] },
  { id: 'lead-31', name: 'Fernanda Araújo', email: 'fernanda.a@email.com', phone: '(48) 99890-1234', channelOrigin: 'Instagram', currentStage: { id: 'stage-6', name: 'Pedido de Curso', position: 6 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'autoconhecimento', inquiry: 'Quero me conhecer profundamente', source: null, adSpend: 15.00, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: true, vslWatchTime: 500, notes: null, createdAt: daysAgo(35), events: [] },
  { id: 'lead-32', name: 'Gabriel Nogueira', email: 'gabriel.n@email.com', phone: '(48) 99901-2345', channelOrigin: 'Instagram', currentStage: { id: 'stage-7', name: 'Ingressou', position: 7 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'busca_espiritual', inquiry: 'Encontrei o que buscava', source: null, adSpend: 12.50, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: true, vslWatchTime: 480, notes: null, createdAt: daysAgo(42), events: [] },
  { id: 'lead-33', name: 'Helena Vieira', email: 'helena.v@email.com', phone: '(48) 99012-3456', channelOrigin: 'TikTok', currentStage: { id: 'stage-7', name: 'Ingressou', position: 7 }, registeredBy: { id: 'user-demo', name: 'Vinícius Demo' }, lifeMoment: 'crise_pessoal', inquiry: 'Transformação pessoal', source: null, adSpend: 11.00, utmSource: null, utmMedium: null, utmCampaign: null, vslWatched: true, vslWatchTime: 510, notes: null, createdAt: daysAgo(40), events: [] },
];

// ============================
// Dashboard Metrics
// ============================
function generateDemoChartData() {
  const byDay = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    byDay.push({
      date: d.toISOString().split('T')[0],
      impressions: 7000 + Math.round(Math.random() * 3000),
      engagement: 350 + Math.round(Math.random() * 200),
      reach: 4500 + Math.round(Math.random() * 2000),
    });
  }
  return byDay;
}

export const DEMO_DASHBOARD = {
  kpis: {
    totalImpressions: 68420,
    totalEngagement: 3850,
    totalFollowers: 7950,
    engagementRate: 5.63,
  },
  trends: {
    impressions: { current: 68420, previous: 62100, change: 10.18, direction: 'up' as const },
    engagement: { current: 3850, previous: 3600, change: 6.94, direction: 'up' as const },
    followers: { current: 7950, previous: 7800, change: 1.92, direction: 'stable' as const },
    engagementRate: { current: 5.63, previous: 5.80, change: -2.93, direction: 'stable' as const },
  },
  chartData: {
    byDay: generateDemoChartData(),
    byChannel: [
      { platform: 'INSTAGRAM', name: '@flfloripa', impressions: 28500, engagement: 1700, followers: 4290 },
      { platform: 'TIKTOK', name: '@flfloripa', impressions: 31200, engagement: 1550, followers: 2950 },
      { platform: 'YOUTUBE', name: 'FL Floripa', impressions: 8720, engagement: 600, followers: 980 },
    ],
  },
};

// ============================
// Channels
// ============================
export const DEMO_CHANNELS = [
  { id: 'ch-ig', platform: 'INSTAGRAM', accountName: '@flfloripa', accountId: 'ig-flfloripa', status: 'CONNECTED', lastSyncAt: daysAgo(0), createdAt: daysAgo(60) },
  { id: 'ch-tt', platform: 'TIKTOK', accountName: '@flfloripa', accountId: 'tt-flfloripa', status: 'CONNECTED', lastSyncAt: daysAgo(0), createdAt: daysAgo(45) },
  { id: 'ch-yt', platform: 'YOUTUBE', accountName: 'FL Floripa', accountId: 'yt-flfloripa', status: 'CONNECTED', lastSyncAt: daysAgo(1), createdAt: daysAgo(30) },
];

// ============================
// Calendar
// ============================
export const DEMO_CALENDAR = [
  { id: 'cal-1', title: 'Reel — Depoimento aluno', description: null, channelId: 'ch-ig', category: 'TESTIMONY', contentTheme: 'EXPERIENCIA', contentFormat: 'REEL', assigneeId: 'user-demo', status: 'PUBLISHED', scheduledDate: today(), createdAt: daysAgo(3), channel: { id: 'ch-ig', platform: 'INSTAGRAM', accountName: '@flfloripa' }, assignee: { id: 'user-demo', name: 'Vinícius Demo' } },
  { id: 'cal-2', title: 'Post — Frase de González Pecotche', description: null, channelId: 'ch-ig', category: 'EDUCATIONAL', contentTheme: 'ENSINAMENTO', contentFormat: 'FEED_POST', assigneeId: 'user-demo', status: 'CREATED', scheduledDate: daysFromNow(1).split('T')[0], createdAt: daysAgo(2), channel: { id: 'ch-ig', platform: 'INSTAGRAM', accountName: '@flfloripa' }, assignee: { id: 'user-demo', name: 'Vinícius Demo' } },
  { id: 'cal-3', title: 'Story — Bastidores atividade', description: null, channelId: 'ch-ig', category: 'INSTITUTIONAL', contentTheme: 'DIVULGACAO', contentFormat: 'STORY', assigneeId: 'user-marcos', status: 'CREATED', scheduledDate: daysFromNow(1).split('T')[0], createdAt: daysAgo(2), channel: { id: 'ch-ig', platform: 'INSTAGRAM', accountName: '@flfloripa' }, assignee: { id: 'user-marcos', name: 'Marcos' } },
  { id: 'cal-4', title: 'TikTok — Dica de leitura', description: null, channelId: 'ch-tt', category: 'EDUCATIONAL', contentTheme: 'DICA_LEITURA', contentFormat: 'REEL', assigneeId: 'user-demo', status: 'PLANNED', scheduledDate: daysFromNow(2).split('T')[0], createdAt: daysAgo(1), channel: { id: 'ch-tt', platform: 'TIKTOK', accountName: '@flfloripa' }, assignee: { id: 'user-demo', name: 'Vinícius Demo' } },
  { id: 'cal-5', title: 'Post — Convite atividade online', description: null, channelId: 'ch-ig', category: 'INVITE', contentTheme: 'CONVITE', contentFormat: 'FEED_POST', assigneeId: 'user-demo', status: 'PLANNED', scheduledDate: daysFromNow(3).split('T')[0], createdAt: daysAgo(1), channel: { id: 'ch-ig', platform: 'INSTAGRAM', accountName: '@flfloripa' }, assignee: { id: 'user-demo', name: 'Vinícius Demo' } },
  { id: 'cal-6', title: 'Reforço — Lembrete atividade sábado', description: null, channelId: 'ch-ig', category: 'INVITE', contentTheme: 'REFORCO_CONVITE', contentFormat: 'STORY', assigneeId: 'user-marcos', status: 'PLANNED', scheduledDate: daysFromNow(4).split('T')[0], createdAt: daysAgo(1), channel: { id: 'ch-ig', platform: 'INSTAGRAM', accountName: '@flfloripa' }, assignee: { id: 'user-marcos', name: 'Marcos' } },
  { id: 'cal-7', title: 'YouTube — Palestra completa', description: null, channelId: 'ch-yt', category: 'EDUCATIONAL', contentTheme: 'ENSINAMENTO', contentFormat: 'VIDEO_LONGO', assigneeId: 'user-demo', status: 'PLANNED', scheduledDate: daysFromNow(5).split('T')[0], createdAt: daysAgo(0), channel: { id: 'ch-yt', platform: 'YOUTUBE', accountName: 'FL Floripa' }, assignee: { id: 'user-demo', name: 'Vinícius Demo' } },
  { id: 'cal-8', title: 'TikTok — Trecho de palestra', description: null, channelId: 'ch-tt', category: 'EDUCATIONAL', contentTheme: 'PODCAST', contentFormat: 'REEL', assigneeId: 'user-marcos', status: 'PLANNED', scheduledDate: daysFromNow(5).split('T')[0], createdAt: daysAgo(0), channel: { id: 'ch-tt', platform: 'TIKTOK', accountName: '@flfloripa' }, assignee: { id: 'user-marcos', name: 'Marcos' } },
];

// ============================
// Users
// ============================
export const DEMO_USERS = [
  { id: 'user-demo', name: 'Vinícius Demo', email: 'demo@logosofia.org.br', image: null, role: 'ADMIN' },
  { id: 'user-marcos', name: 'Marcos', email: 'marcos@logosofia.org.br', image: null, role: 'EDITOR' },
];

// ============================
// Campaigns
// ============================
export const DEMO_CAMPAIGNS = [
  {
    id: 'camp-1', name: 'VSL Marco 2026', status: 'ACTIVE', objective: 'CONVERSIONS', budget: 500,
    startDate: daysAgo(30), endDate: daysFromNow(30),
    channel: { platform: 'INSTAGRAM', accountName: '@flfloripa' },
    summary: { totalSpend: 245.60, totalImpressions: 28500, totalClicks: 1420, totalConversions: 5, cpm: 8.62, cpc: 0.17, ctr: 4.98 },
  },
  {
    id: 'camp-2', name: 'Carrossel Depoimentos', status: 'ACTIVE', objective: 'ENGAGEMENT', budget: 200,
    startDate: daysAgo(14), endDate: daysFromNow(16),
    channel: { platform: 'TIKTOK', accountName: '@flfloripa' },
    summary: { totalSpend: 76.80, totalImpressions: 31200, totalClicks: 890, totalConversions: 3, cpm: 2.46, cpc: 0.09, ctr: 2.85 },
  },
];

// ============================
// Alerts
// ============================
export const DEMO_ALERTS = [
  { id: 'alert-1', type: 'ENGAGEMENT_DROP', severity: 'WARNING', message: 'Engajamento do Instagram caiu 15% esta semana', isRead: false, channel: { platform: 'INSTAGRAM', accountName: '@flfloripa' }, campaign: null, createdAt: daysAgo(1) },
  { id: 'alert-2', type: 'BUDGET_THRESHOLD', severity: 'INFO', message: 'Campanha "VSL Marco 2026" atingiu 49% do orçamento', isRead: true, channel: null, campaign: { name: 'VSL Marco 2026' }, createdAt: daysAgo(3) },
];

// ============================
// Reports
// ============================
export const DEMO_REPORTS = [
  { id: 'report-1', type: 'WEEKLY', periodStart: daysAgo(14), periodEnd: daysAgo(7), fileUrl: null, generatedBy: { id: 'user-demo', name: 'Vinícius Demo' }, createdAt: daysAgo(7) },
  { id: 'report-2', type: 'MONTHLY', periodStart: daysAgo(60), periodEnd: daysAgo(30), fileUrl: null, generatedBy: { id: 'user-demo', name: 'Vinícius Demo' }, createdAt: daysAgo(30) },
];
