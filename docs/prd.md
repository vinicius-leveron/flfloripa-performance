# Product Requirements Document - FLFloripa Performance

## Overview

**Product:** FLFloripa Performance Platform
**Version:** 1.0.0
**Author:** Comissão de Performance — Fundação Logosófica de Florianópolis
**Date:** 2026-03-07
**Status:** Draft

---

## 1. Goals and Background Context

### Goals

- Atrair mais pessoas para as **reuniões presenciais** na Fundação Logosófica de Florianópolis através de canais digitais estruturados
- Substituir processos manuais (papel, planilhas) por uma plataforma web centralizada de gestão de performance
- Criar um funil de conversão rastreável: redes sociais → conteúdo/webinar → visita presencial → retenção
- Dar visibilidade à comissão de mídias sobre o desempenho dos canais (TikTok, Instagram, LinkedIn, Meta Ads)
- Estabelecer cadências de publicação previsíveis e mensuráveis
- Permitir decisões baseadas em dados, não intuição

### Background Context

A Fundação Logosófica de Florianópolis é uma instituição dedicada ao estudo e difusão da Logosofia. Atualmente, a comissão de mídias produz conteúdo para TikTok, Instagram e LinkedIn com frequência baixa (1-3 posts/semana), sem estratégia organizada, calendário editorial, ou tracking de resultados. Todo o controle é feito manualmente em papel e planilhas por uma equipe de 6-10 pessoas, em sua maioria não-técnicas.

A comissão de performance (growth) foi recentemente criada para modernizar essa operação. O objetivo é construir um funil digital que converta audiência online em visitantes presenciais. Hoje não existe landing page — todo contato acontece diretamente pelas redes sociais. Há investimento em mídia paga no Meta (Facebook/Instagram Ads), mas sem rastreamento estruturado de ROI ou conversões. Esta plataforma visa resolver essas lacunas.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-07 | 0.1.0 | Initial PRD draft | @pm (Morgan) |

---

## 2. Requirements

### Functional

**FR1:** O sistema deve exibir um **dashboard unificado de métricas** consolidando dados de TikTok, Instagram e LinkedIn em um único painel, com métricas de impressões, alcance, engajamento (likes, comentários, shares, saves), cliques e crescimento de seguidores.

**FR2:** O dashboard deve suportar **filtros por período** (últimos 7 dias, 30 dias, 90 dias, período customizado) e **filtros por canal**, permitindo comparativo lado a lado entre canais.

**FR3:** O dashboard deve exibir **indicadores de tendência** (melhorando/piorando/estável) para cada métrica principal, usando setas ou cores para facilitar leitura rápida por usuários não-técnicos.

**FR4:** O sistema deve implementar um **funil de conversão de 6 estágios**: (1) Alcance — impressões/views nas redes, (2) Engajamento — interações com conteúdo, (3) Interesse — cliques em links, visitas ao perfil, DMs, (4) Consideração — cadastro em webinar/conteúdo especial, (5) Conversão — comparecimento à reunião presencial, (6) Retenção — retorno e fidelização.

**FR5:** O sistema deve permitir **registro manual de leads** nos estágios 4-6 do funil (Consideração, Conversão, Retenção), já que não há landing page automatizada. Cada lead deve ter: nome, contato, origem (canal), data de entrada, estágio atual, e notas.

**FR6:** O sistema deve exibir uma **visualização de funil** com taxas de conversão entre cada estágio, mostrando quantas pessoas avançam de um estágio ao próximo e a taxa de drop-off.

**FR7:** O sistema deve oferecer um **calendário de conteúdo** com visão mensal e semanal, onde cada entrada tem: título, canal de destino, categoria (educacional, institucional, convite, testemunho), responsável, status (planejado, criado, publicado), e data prevista.

**FR8:** O calendário deve exibir um **indicador de aderência à cadência**, comparando o número real de publicações com a meta definida (ex: 3 posts/semana), destacando visualmente semanas abaixo da meta.

**FR9:** O sistema deve integrar com a **Meta Marketing API** para importar dados de campanhas pagas (Facebook/Instagram Ads), exibindo: gasto total, impressões, cliques, CPM, CPC, CTR por campanha.

**FR10:** O sistema deve calcular e exibir o **ROI por campanha paga**, correlacionando custo da campanha com conversões registradas no funil (estágios 4-6).

**FR11:** O sistema deve enviar **alertas de performance** quando uma campanha paga ou um canal apresentar queda significativa de métricas (ex: -30% em engajamento vs. período anterior).

**FR12:** O sistema deve permitir **autenticação por email/senha** com 3 níveis de acesso: Admin (configurações, integrações, todos os dados), Editor (criar conteúdo, registrar leads), Viewer (visualizar dashboards e relatórios).

**FR13:** O sistema deve permitir **conectar contas** dos canais (Instagram Business, TikTok Business, LinkedIn Page) via OAuth, com sync automático de métricas em background.

**FR14:** O sistema deve gerar **relatórios semanais e mensais** com resumo de performance por canal, progresso do funil, e resultados de campanhas pagas, exportáveis em PDF.

**FR15:** O sistema deve manter uma **lista de leads/contatos** com busca, filtros por estágio do funil, e histórico de movimentações por contato.

### Non Functional

**NFR1: Usabilidade** — A interface deve ser intuitiva para usuários não-técnicos. Todas as ações principais devem ser alcançáveis em no máximo 3 cliques. O sistema deve incluir onboarding guiado no primeiro acesso.

**NFR2: Performance** — O dashboard principal deve carregar em menos de 3 segundos. A sincronização de métricas dos canais deve ocorrer em background sem impactar a experiência do usuário.

**NFR3: Responsividade** — A interface deve ser totalmente funcional em dispositivos mobile (smartphones e tablets), já que membros da comissão frequentemente acessam pelo celular.

**NFR4: Segurança e LGPD** — Dados de leads (nome, contato) devem ser armazenados com criptografia. O sistema deve permitir exclusão de dados pessoais a pedido do titular (direito ao esquecimento). Autenticação deve usar bcrypt ou equivalente para senhas.

**NFR5: Disponibilidade** — O sistema deve manter 99.5% de uptime. Deploy em plataforma gerenciada (Vercel) para minimizar operações.

**NFR6: Idioma** — A interface deve ser inteiramente em Português do Brasil (pt-BR). Não há necessidade de internacionalização.

**NFR7: Sync de Dados** — As métricas dos canais devem ser sincronizadas automaticamente a cada 6 horas, com opção de sync manual sob demanda.

**NFR8: Backup** — Dados do banco devem ter backup automático diário com retenção de 30 dias.

---

## 3. User Interface Design Goals

### Overall UX Vision

Interface limpa, moderna e acolhedora — sem parecer um painel de controle corporativo intimidador. O design deve transmitir organização e clareza, usando cards, gráficos simples e indicadores visuais de cor (verde = bom, amarelo = atenção, vermelho = ação necessária). A experiência deve ser similar à de apps que a equipe já usa (Instagram Insights, mas mais completo e em português).

### Key Interaction Paradigms

- **Dashboard-first**: A tela inicial é sempre o dashboard com visão geral
- **Drill-down**: Clicar em qualquer métrica leva aos detalhes (canal específico, período, posts)
- **Quick-actions**: Botões de ação rápida para registrar lead, criar entrada no calendário
- **Notificações inline**: Alertas e tendências aparecem no contexto, sem popups intrusivos

### Core Screens and Views

1. **Dashboard Principal** — Visão geral com KPIs, gráficos de tendência, funil resumido
2. **Detalhes por Canal** — Métricas detalhadas de um canal específico (Instagram, TikTok, LinkedIn)
3. **Funil de Conversão** — Visualização do funil com leads em cada estágio
4. **Calendário de Conteúdo** — Visão mensal/semanal com posts planejados e publicados
5. **Campanhas Pagas** — Lista de campanhas Meta Ads com métricas e ROI
6. **Leads/Contatos** — Lista pesquisável com filtros e detalhes por contato
7. **Relatórios** — Geração e histórico de relatórios
8. **Configurações** — Conexão de canais, gerenciamento de usuários, preferências
9. **Login/Registro** — Autenticação simples com email/senha

### Accessibility

WCAG AA — O sistema deve ser acessível para pessoas com deficiência visual parcial (contraste adequado, textos legíveis, navegação por teclado).

### Branding

Cores e identidade visual da Fundação Logosófica de Florianópolis. Tom institucional mas moderno. Sem elementos religiosos explícitos — foco em educação e cultura. Paleta a ser definida com a comissão de mídias.

### Target Device and Platforms

Web Responsive — Otimizado para desktop (uso principal durante reuniões da comissão) e mobile (consultas rápidas no dia a dia).

---

## 4. Technical Assumptions

### Repository Structure: Monorepo

Projeto único em monorepo. Toda a aplicação (frontend + backend) reside no mesmo repositório usando Next.js como fullstack framework.

### Service Architecture

**Monolith (Next.js Fullstack)** — Para o MVP, uma aplicação monolítica é a escolha mais pragmática:

- **Frontend:** Next.js 16+ com App Router, React Server Components
- **Backend:** Next.js Route Handlers (API Routes)
- **Database:** PostgreSQL via Prisma ORM (hospedado em Supabase ou Neon)
- **Auth:** NextAuth.js v5 (Auth.js) com provider Credentials
- **State Management:** Zustand (global UI state) + React Query/TanStack Query (server state)
- **UI Components:** shadcn/ui + Tailwind CSS
- **Charts:** Recharts (gráficos de dashboard)
- **Background Jobs:** Vercel Cron Functions (sync de métricas a cada 6h)
- **Deploy:** Vercel (frontend + API + cron)
- **Forms:** React Hook Form + Zod (validação)

### Integrações Externas

| Integração | API | Autenticação | Dados Consumidos |
|------------|-----|--------------|------------------|
| Instagram | Meta Graph API v21 | OAuth 2.0 (Facebook Login) | Posts, stories, insights, métricas de conta |
| Facebook Ads | Meta Marketing API v21 | OAuth 2.0 (Facebook Login) | Campanhas, ad sets, ads, métricas de performance |
| TikTok | TikTok Business API v2 | OAuth 2.0 | Vídeos publicados, analytics de conta |
| LinkedIn | LinkedIn Marketing API | OAuth 2.0 (3-legged) | Posts de company page, analytics |

### Testing Requirements

**Unit + Integration** — Vitest para testes unitários e de integração. Playwright para testes E2E dos fluxos críticos (login, dashboard, registro de lead). MSW para mock de APIs externas nos testes.

### Additional Technical Assumptions and Requests

- O projeto será hospedado na Vercel (free tier inicialmente, upgrade conforme necessidade)
- PostgreSQL será hospedado no Supabase (free tier: 500MB, 2 projetos)
- As APIs de redes sociais requerem contas Business/Creator verificadas
- Rate limits das APIs devem ser respeitados (Meta: 200 calls/hour, TikTok: 100/min, LinkedIn: 100/day)
- Dados de métricas serão armazenados como snapshots diários (não em tempo real)
- O sistema não publica conteúdo — apenas lê métricas e dados dos canais
- Não há necessidade de WebSocket ou real-time — polling com React Query é suficiente

---

## 5. Epic List

### Epic 1: Foundation, Auth & Layout
Estabelecer a infraestrutura do projeto (Next.js, Prisma, PostgreSQL), implementar autenticação com 3 níveis de acesso, e criar o layout base com sidebar navigation. Entregar uma aplicação funcional com login e página inicial.

### Epic 2: Channel Integration & Metrics Dashboard
Implementar OAuth flows para conectar contas dos canais (Instagram, TikTok, LinkedIn), criar jobs de sync de métricas, e construir o dashboard principal com gráficos de tendência e filtros.

### Epic 3: Content Calendar & Cadence Tracking
Construir o calendário de conteúdo com visão mensal/semanal, CRUD de entradas, atribuição de responsáveis, categorias, e indicador de aderência à cadência.

### Epic 4: Conversion Funnel & Lead Management
Implementar o funil de 6 estágios com visualização gráfica, CRUD de leads com registro manual, histórico de movimentações, e taxas de conversão entre estágios.

### Epic 5: Meta Ads Integration & Campaign Management
Integrar com Meta Marketing API para importar campanhas pagas, exibir métricas de performance, calcular ROI correlacionando com conversões do funil, e configurar alertas.

### Epic 6: Reports, Exports & Polish
Implementar geração de relatórios semanais/mensais em PDF, histórico de relatórios, onboarding guiado para novos usuários, e refinamentos de UX baseados em feedback.

---

## 6. Epic Details

### Epic 1: Foundation, Auth & Layout

**Goal:** Estabelecer a base técnica do projeto com autenticação funcional e layout navegável. Ao final deste épico, a aplicação estará rodando em produção com login, registro, e uma página inicial protegida com sidebar navigation — pronta para receber funcionalidades.

#### Story 1.1: Project Setup & Database Schema

**As a** developer,
**I want** the project initialized with Next.js, Prisma, and PostgreSQL,
**so that** we have a solid foundation to build features on.

**Acceptance Criteria:**
1. Projeto Next.js 16+ criado com TypeScript strict, Tailwind CSS, e shadcn/ui configurados
2. Prisma ORM configurado e conectado a PostgreSQL (Supabase)
3. Schema inicial criado com tabelas: User (id, email, password_hash, name, role, created_at, updated_at), Channel, Post, Metric, Campaign, FunnelStage, Lead, LeadEvent, ContentCalendarEntry
4. Migration inicial executada com sucesso
5. Seed script populando estágios do funil (6 estágios pré-definidos)
6. ESLint e Prettier configurados
7. Variáveis de ambiente documentadas em `.env.example`
8. Projeto roda localmente com `npm run dev`

#### Story 1.2: Authentication (Login, Register, Roles)

**As a** team member,
**I want** to log in with my email and password,
**so that** I can access the platform securely with my role's permissions.

**Acceptance Criteria:**
1. NextAuth.js v5 configurado com Credentials provider
2. Página de login (`/login`) com formulário email/senha, validação com Zod
3. Página de registro (`/register`) com nome, email, senha, confirmação de senha
4. Senhas hashadas com bcrypt antes de salvar no banco
5. 3 roles implementados: ADMIN, EDITOR, VIEWER
6. Primeiro usuário registrado recebe role ADMIN automaticamente
7. Middleware de autenticação protege todas as rotas exceto `/login` e `/register`
8. Redirect para `/login` quando não autenticado
9. Session persiste entre refreshes do browser

#### Story 1.3: Base Layout with Sidebar Navigation

**As a** authenticated user,
**I want** a clean layout with sidebar navigation,
**so that** I can easily navigate between different sections of the platform.

**Acceptance Criteria:**
1. Layout principal com sidebar colapsável (ícones quando colapsada, ícones + texto quando expandida)
2. Menu items: Dashboard, Canais, Calendário, Funil, Campanhas, Leads, Relatórios, Configurações
3. Header com nome do usuário, role badge, e botão de logout
4. Sidebar responsiva: drawer em mobile, fixa em desktop
5. Página inicial (`/dashboard`) com mensagem de boas-vindas e cards placeholder para métricas
6. Página de configurações (`/settings`) com seção de perfil do usuário
7. Componentes usando shadcn/ui (Sidebar, Button, Card, Avatar)
8. Todas as páginas protegidas por autenticação

---

### Epic 2: Channel Integration & Metrics Dashboard

**Goal:** Conectar os canais de mídia social à plataforma e construir o dashboard principal. Ao final deste épico, a comissão poderá ver métricas consolidadas de todos os canais em tempo real, com gráficos de tendência, filtros por período, e indicadores de performance.

#### Story 2.1: Channel Connection (OAuth Flows)

**As an** admin,
**I want** to connect our social media accounts to the platform,
**so that** metrics can be automatically imported.

**Acceptance Criteria:**
1. Página `/settings/channels` com lista de canais disponíveis (Instagram, TikTok, LinkedIn)
2. Botão "Conectar" para cada canal, iniciando OAuth flow
3. Instagram/Facebook: OAuth 2.0 via Facebook Login, solicitando permissions de `instagram_basic`, `instagram_manage_insights`, `pages_show_list`
4. TikTok: OAuth 2.0 solicitando `user.info.basic`, `video.list`, `video.insights`
5. LinkedIn: OAuth 2.0 3-legged solicitando `r_organization_social`, `r_organization_admin`
6. Tokens armazenados criptografados no banco (tabela Channel: platform, access_token, refresh_token, expires_at, account_name, account_id)
7. Status visual por canal: Conectado (verde), Desconectado (cinza), Erro (vermelho)
8. Botão "Desconectar" para revogar acesso

#### Story 2.2: Metrics Sync (Background Jobs)

**As a** platform,
**I want** to automatically sync metrics from connected channels every 6 hours,
**so that** the dashboard always shows recent data.

**Acceptance Criteria:**
1. Vercel Cron Function configurada para executar a cada 6 horas
2. Para cada canal conectado, buscar métricas dos últimos 7 dias via API
3. Métricas coletadas por dia: impressions, reach, engagement (likes + comments + shares + saves), profile_visits, link_clicks, followers_count
4. Dados salvos na tabela Metric (channel_id, date, metric_type, value)
5. Tratamento de rate limits com retry exponencial
6. Refresh automático de tokens expirados (usando refresh_token)
7. Log de sync com status (success/error) por canal
8. Botão "Sincronizar agora" na página de canais para sync manual

#### Story 2.3: Metrics Dashboard (Charts & Filters)

**As a** team member,
**I want** to see a unified dashboard with metrics from all channels,
**so that** I can quickly understand our digital performance.

**Acceptance Criteria:**
1. Dashboard (`/dashboard`) com 4 KPI cards no topo: Total de Impressões, Total de Engajamento, Total de Seguidores, Taxa de Engajamento média
2. Gráfico de linha (Recharts) mostrando tendência de impressões e engajamento ao longo do tempo
3. Gráfico de barras comparando performance entre canais
4. Filtro de período: 7 dias, 30 dias, 90 dias, customizado (date picker)
5. Filtro por canal: Todos, Instagram, TikTok, LinkedIn
6. Indicadores de tendência em cada KPI card: seta para cima (verde) se melhorou vs. período anterior, seta para baixo (vermelho) se piorou, traço (amarelo) se estável (variação < 5%)
7. Loading skeletons enquanto dados carregam
8. Estado vazio com call-to-action para conectar canais quando nenhum está conectado
9. Dados servidos via React Query com cache de 5 minutos

---

### Epic 3: Content Calendar & Cadence Tracking

**Goal:** Dar à comissão de mídias uma ferramenta visual para planejar, organizar e acompanhar publicações. Ao final deste épico, a equipe terá um calendário editorial interativo com indicador de aderência à cadência meta.

#### Story 3.1: Content Calendar (Monthly/Weekly View)

**As a** media commission member,
**I want** a visual calendar to plan and track our content publications,
**so that** we can organize our posting schedule.

**Acceptance Criteria:**
1. Página `/calendar` com visão mensal (grid) e semanal (lista expandida)
2. Toggle para alternar entre visão mensal e semanal
3. Cada entrada no calendário mostra: título (truncado), ícone do canal, cor da categoria, avatar do responsável
4. Clicar em uma entrada abre modal com detalhes completos
5. Botão "+" em cada dia para criar nova entrada rapidamente
6. Drag-and-drop para mover entradas entre dias (desktop only)
7. Navegação entre meses/semanas com botões anterior/próximo

#### Story 3.2: Content Entry CRUD & Categories

**As an** editor,
**I want** to create and manage content entries in the calendar,
**so that** we can plan our publications in advance.

**Acceptance Criteria:**
1. Modal/drawer de criação com campos: título, descrição, canal (Instagram/TikTok/LinkedIn/Todos), categoria (Educacional, Institucional, Convite, Testemunho), responsável (select de usuários), data prevista, status (Planejado, Criado, Publicado)
2. Validação com Zod: título obrigatório, canal obrigatório, data obrigatória
3. Edição inline: clicar em uma entrada permite editar todos os campos
4. Exclusão com confirmação ("Tem certeza?")
5. Filtros na visão do calendário: por canal, por categoria, por responsável
6. Status com cores: Planejado (azul), Criado (amarelo), Publicado (verde)
7. Viewers podem ver mas não criar/editar/excluir entradas

#### Story 3.3: Cadence Tracking & Adherence Indicator

**As a** performance team member,
**I want** to see if we're meeting our posting cadence goals,
**so that** I can identify when we're falling behind.

**Acceptance Criteria:**
1. Configuração de meta de cadência em `/settings`: posts por semana por canal (ex: Instagram 3/semana, TikTok 2/semana)
2. No calendário, barra de progresso semanal mostrando "X de Y posts publicados esta semana"
3. Semanas abaixo de 70% da meta destacadas em vermelho claro no fundo
4. No dashboard, card "Aderência à Cadência" com % das últimas 4 semanas
5. Gráfico de aderência ao longo do tempo (últimas 12 semanas)

---

### Epic 4: Conversion Funnel & Lead Management

**Goal:** Implementar o funil de conversão com 6 estágios e a gestão de leads, permitindo rastrear a jornada desde o primeiro contato digital até a visita presencial e retenção.

#### Story 4.1: Funnel Visualization

**As a** team member,
**I want** to see our conversion funnel with metrics at each stage,
**so that** I can understand where people drop off.

**Acceptance Criteria:**
1. Página `/funnel` com visualização de funil (formato trapézio/pirâmide invertida)
2. 6 estágios exibidos: Alcance, Engajamento, Interesse, Consideração, Conversão, Retenção
3. Estágios 1-3 (Alcance, Engajamento, Interesse) populados automaticamente com dados dos canais (métricas sincronizadas)
4. Estágios 4-6 (Consideração, Conversão, Retenção) populados manualmente via leads registrados
5. Taxa de conversão entre cada estágio exibida como % (ex: "Alcance → Engajamento: 4.2%")
6. Filtro por período (7d, 30d, 90d)
7. Cores do funil: gradiente de azul claro (topo) a verde (base)

#### Story 4.2: Lead Registration & Management

**As an** editor,
**I want** to register and manage leads manually,
**so that** we can track people through the lower funnel stages.

**Acceptance Criteria:**
1. Página `/leads` com tabela de leads (nome, contato, canal de origem, estágio atual, data de entrada, última atualização)
2. Botão "Novo Lead" abrindo formulário com: nome (obrigatório), email ou telefone, canal de origem (select), estágio inicial (default: Consideração), notas
3. Edição de lead: alterar dados e mover entre estágios
4. Ao mover um lead de estágio, registrar LeadEvent (lead_id, from_stage, to_stage, date, notes)
5. Busca por nome ou contato
6. Filtros por estágio, por canal de origem, por período de entrada
7. Paginação (20 leads por página)
8. Viewers podem ver leads mas não criar/editar

#### Story 4.3: Lead Detail & History

**As a** team member,
**I want** to see the full history of a lead's journey,
**so that** I can understand their path to conversion.

**Acceptance Criteria:**
1. Página `/leads/[id]` com detalhes completos do lead
2. Timeline visual mostrando todos os LeadEvents (movimentações entre estágios) com data e notas
3. Seção de notas com textarea para adicionar observações
4. Botão "Mover para próximo estágio" com confirmação
5. Botão "Remover lead" (admin only) com confirmação e soft-delete
6. Indicador de tempo em cada estágio (ex: "12 dias em Consideração")

---

### Epic 5: Meta Ads Integration & Campaign Management

**Goal:** Integrar com a Meta Marketing API para importar e visualizar campanhas pagas, calcular ROI correlacionando com o funil de conversão, e configurar alertas de performance.

#### Story 5.1: Meta Ads Connection & Campaign Import

**As an** admin,
**I want** to connect our Meta Ads account and import campaign data,
**so that** we can track paid campaign performance.

**Acceptance Criteria:**
1. Na página de canais (`/settings/channels`), seção "Meta Ads" com botão "Conectar Meta Ads"
2. OAuth flow solicitando permissions: `ads_read`, `ads_management` (read-only)
3. Após conexão, importar lista de campanhas ativas e recentes (últimos 90 dias)
4. Dados por campanha: name, status, objective, budget, spend, impressions, clicks, cpm, cpc, ctr
5. Sync automático junto com o cron de métricas (a cada 6h)
6. Dados salvos na tabela Campaign (meta_campaign_id, name, status, objective, metrics JSON)

#### Story 5.2: Campaign Dashboard & ROI

**As a** performance team member,
**I want** to see campaign performance and ROI in the platform,
**so that** I can evaluate which campaigns are worth the investment.

**Acceptance Criteria:**
1. Página `/campaigns` com lista de campanhas em cards ou tabela
2. Por campanha: gasto, impressões, cliques, CPM, CPC, CTR exibidos
3. Cálculo de ROI: correlacionar leads nos estágios 4-6 com campanhas ativas no mesmo período
4. Gráfico de gasto vs. conversões ao longo do tempo
5. Comparativo entre campanhas (tabela com ranking por CTR, CPC, conversões)
6. Filtro por período e por status (ativa, pausada, encerrada)

#### Story 5.3: Performance Alerts

**As a** team member,
**I want** to receive alerts when performance drops significantly,
**so that** I can take action quickly.

**Acceptance Criteria:**
1. Configuração de alertas em `/settings/alerts`: thresholds por métrica (ex: queda > 30% em engajamento)
2. Alertas exibidos como banner no topo do dashboard quando ativados
3. Página `/alerts` com histórico de alertas (data, tipo, canal/campanha, valor anterior vs. atual)
4. Check de alertas executado junto com o cron de sync (a cada 6h)
5. Alertas marcáveis como "visto" para limpar do banner

---

### Epic 6: Reports, Exports & Polish

**Goal:** Completar a plataforma com geração de relatórios em PDF, onboarding para novos usuários, e refinamentos de UX para garantir adoção pela equipe não-técnica.

#### Story 6.1: Report Generation (PDF Export)

**As a** team member,
**I want** to generate performance reports in PDF format,
**so that** I can share results with the broader commission during meetings.

**Acceptance Criteria:**
1. Página `/reports` com botão "Gerar Relatório"
2. Opções de relatório: Semanal (últimos 7 dias), Mensal (último mês), Customizado (período selecionado)
3. Relatório inclui: resumo de KPIs, gráfico de tendência, performance por canal, status do funil, campanhas ativas, aderência à cadência
4. Exportação em PDF usando biblioteca de renderização server-side (ex: @react-pdf/renderer ou puppeteer)
5. Histórico de relatórios gerados com download disponível
6. Relatório gerado em background (não bloqueia a UI)

#### Story 6.2: Onboarding & Empty States

**As a** new user,
**I want** guided onboarding when I first access the platform,
**so that** I know how to use it effectively even without technical knowledge.

**Acceptance Criteria:**
1. Tour guiado no primeiro login com 5 passos: (1) Boas-vindas, (2) Dashboard, (3) Conectar canais, (4) Calendário, (5) Registrar leads
2. Empty states informativos em todas as páginas quando não há dados (ex: "Nenhum canal conectado. Clique aqui para começar.")
3. Tooltips de ajuda em elementos complexos (ícone "?" ao lado de métricas como CPM, CTR)
4. Seção de ajuda em `/settings/help` com FAQ básico
5. Tour pode ser re-iniciado a qualquer momento via configurações

#### Story 6.3: UX Polish & Mobile Optimization

**As a** team member using the platform on my phone,
**I want** the interface to work smoothly on mobile,
**so that** I can check metrics on the go.

**Acceptance Criteria:**
1. Dashboard responsivo: KPI cards em stack vertical no mobile, gráficos com scroll horizontal
2. Calendário mobile: visão semanal como default, swipe para navegar entre semanas
3. Funil mobile: visualização vertical simplificada
4. Sidebar: drawer com gesture de swipe para abrir/fechar
5. Botões e touch targets com mínimo 44x44px
6. Testar em Chrome Mobile, Safari iOS, Samsung Internet
7. Lighthouse mobile score > 80 em performance

---

## 7. Checklist Results Report

*To be populated after PM checklist execution.*

---

## 8. Next Steps

### UX Expert Prompt

> @ux-design-expert: Review the PRD at `docs/prd.md` for the FLFloripa Performance Platform. Create the frontend architecture with component hierarchy, design system tokens (colors, typography, spacing based on Fundação Logosófica branding), and wireframes for the 9 core screens defined in the UI Design Goals section. Focus on simplicity for non-technical users and mobile responsiveness.

### Architect Prompt

> @architect: Review the PRD at `docs/prd.md` for the FLFloripa Performance Platform. Create the full-stack architecture document at `docs/architecture/` covering: (1) Next.js project structure following the feature-based organization from the nextjs-react preset, (2) Prisma schema with all entities and relationships, (3) API route design for channel sync, metrics, leads, campaigns, (4) OAuth integration architecture for Meta/TikTok/LinkedIn, (5) Cron job design for background sync, (6) Security model (auth middleware, role-based access, LGPD compliance). Use the Contract Pattern and Repository Pattern from the tech preset.

---

**Generated by:** AIOX PM Agent (Morgan) — Synkra AIOX v5.0.3
**Template Version:** prd-v2.0
