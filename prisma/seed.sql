-- FLFloripa Performance - Seed Data
-- Execute AFTER migration.sql in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ilpnwtelpxqyqzlhwpjm/sql/new

-- ==========================================
-- 1. Users (admin + editor)
-- ==========================================
-- Password: demo1234 (bcrypt hash with 12 rounds)
INSERT INTO "users" ("id", "email", "name", "password_hash", "role", "created_at", "updated_at") VALUES
('user-demo', 'demo@logosofia.org.br', 'Vinícius', '$2b$12$CGRa9rB5WqlEp0YDSmUXJuK3bOb2vbF2HBzAWahYvVOr9y8sGrFDq', 'ADMIN', now(), now()),
('user-marcos', 'marcos@logosofia.org.br', 'Marcos', NULL, 'EDITOR', now(), now());

-- ==========================================
-- 2. Funnel Stages (7 stages)
-- ==========================================
INSERT INTO "funnel_stages" ("id", "name", "position", "description", "source", "created_at") VALUES
('stage-1', 'Impactado', 1, 'Viu o criativo/anúncio nas redes sociais', 'AUTO', now()),
('stage-2', 'Visitou VSL', 2, 'Clicou e assistiu a VSL na landing page', 'AUTO', now()),
('stage-3', 'Inscrito Atividade', 3, 'Preencheu formulário para atividade online', 'MANUAL', now()),
('stage-4', 'Participou Online', 4, 'Compareceu à atividade online ao vivo', 'MANUAL', now()),
('stage-5', 'Participou Presencial', 5, 'Veio à atividade presencial na sede', 'MANUAL', now()),
('stage-6', 'Pedido de Curso', 6, 'Solicitou ingresso no curso de formação', 'MANUAL', now()),
('stage-7', 'Ingressou', 7, 'Efetivou ingresso na Fundação Logosófica', 'MANUAL', now());

-- ==========================================
-- 3. Channels (DISCONNECTED - connect via OAuth)
-- ==========================================
INSERT INTO "channels" ("id", "platform", "account_name", "account_id", "access_token", "status", "user_id", "created_at") VALUES
('ch-ig', 'INSTAGRAM', '@flfloripa', 'ig-flfloripa', '', 'DISCONNECTED', 'user-demo', now()),
('ch-tt', 'TIKTOK', '@flfloripa', 'tt-flfloripa', '', 'DISCONNECTED', 'user-demo', now()),
('ch-yt', 'YOUTUBE', 'FL Floripa', 'yt-flfloripa', '', 'DISCONNECTED', 'user-demo', now());

-- ==========================================
-- 4. Cadence Goals
-- ==========================================
INSERT INTO "cadence_goals" ("id", "platform", "posts_per_week", "updated_at") VALUES
(gen_random_uuid(), 'INSTAGRAM', 5, now()),
(gen_random_uuid(), 'TIKTOK', 3, now()),
(gen_random_uuid(), 'LINKEDIN', 2, now()),
(gen_random_uuid(), 'YOUTUBE', 1, now());

-- ==========================================
-- 5. Alert Thresholds
-- ==========================================
INSERT INTO "alert_thresholds" ("id", "metric_name", "drop_percentage", "updated_at") VALUES
(gen_random_uuid(), 'engagement', 20, now()),
(gen_random_uuid(), 'reach', 30, now()),
(gen_random_uuid(), 'impressions', 25, now());

-- ==========================================
-- 6. Sample Leads
-- ==========================================
INSERT INTO "leads" ("id", "name", "email", "phone", "channel_origin", "current_stage_id", "registered_by_id", "life_moment", "inquiry", "source", "ad_spend", "utm_source", "utm_medium", "utm_campaign", "vsl_watched", "vsl_watch_time", "is_deleted", "created_at", "updated_at") VALUES
-- Stage 1 - Impactado
(gen_random_uuid(), 'Ana Carolina', NULL, NULL, 'Instagram', 'stage-1', 'user-demo', 'autoconhecimento', 'Sinto que preciso de algo mais profundo', 'vsl-marco-2026', 12.50, 'meta', 'cpc', 'vsl-marco-2026', false, NULL, false, now(), now()),
(gen_random_uuid(), 'Bruno Martins', NULL, NULL, 'TikTok', 'stage-1', 'user-demo', 'transicao_carreira', 'Mudança de vida', 'carrossel-depoimentos', 8.30, 'tiktok', 'cpc', 'carrossel-depoimentos', false, NULL, false, now(), now()),
(gen_random_uuid(), 'Camila Ferreira', NULL, NULL, 'Instagram', 'stage-1', 'user-demo', NULL, NULL, NULL, 11.20, NULL, NULL, NULL, false, NULL, false, now(), now()),
(gen_random_uuid(), 'Diego Souza', NULL, NULL, 'Instagram', 'stage-1', 'user-demo', NULL, NULL, NULL, 9.80, NULL, NULL, NULL, false, NULL, false, now(), now()),
(gen_random_uuid(), 'Eduarda Lima', NULL, NULL, 'TikTok', 'stage-1', 'user-demo', NULL, NULL, NULL, 7.60, NULL, NULL, NULL, false, NULL, false, now(), now()),
(gen_random_uuid(), 'Fernando Alves', NULL, NULL, 'YouTube', 'stage-1', 'user-demo', NULL, NULL, NULL, 15.00, NULL, NULL, NULL, false, NULL, false, now(), now()),
(gen_random_uuid(), 'Gabriela Costa', NULL, NULL, 'Instagram', 'stage-1', 'user-demo', NULL, NULL, NULL, 10.40, NULL, NULL, NULL, false, NULL, false, now(), now()),
(gen_random_uuid(), 'Hugo Pereira', NULL, NULL, 'TikTok', 'stage-1', 'user-demo', NULL, NULL, NULL, 6.90, NULL, NULL, NULL, false, NULL, false, now(), now()),
-- Stage 2 - Visitou VSL
(gen_random_uuid(), 'Mariana Silva', NULL, NULL, 'Instagram', 'stage-2', 'user-demo', 'busca_espiritual', 'Procurando propósito na vida', 'vsl-marco-2026', 12.00, 'meta', 'cpc', 'vsl-marco-2026', true, 240, false, now(), now()),
(gen_random_uuid(), 'Nicolas Santos', NULL, NULL, 'TikTok', 'stage-2', 'user-demo', NULL, NULL, NULL, 9.50, NULL, NULL, NULL, true, 180, false, now(), now()),
(gen_random_uuid(), 'Olivia Nascimento', NULL, NULL, 'Instagram', 'stage-2', 'user-demo', NULL, NULL, NULL, 11.00, NULL, NULL, NULL, true, 320, false, now(), now()),
(gen_random_uuid(), 'Pedro Henrique', NULL, NULL, 'Instagram', 'stage-2', 'user-demo', NULL, NULL, NULL, 13.50, NULL, NULL, NULL, true, 150, false, now(), now()),
-- Stage 3 - Inscrito Atividade
(gen_random_uuid(), 'Vanessa Duarte', 'vanessa.d@email.com', '(48) 99123-4567', 'Instagram', 'stage-3', 'user-demo', 'paternidade', 'Como educar meus filhos com valores', 'vsl-marco-2026', 14.00, 'meta', 'cpc', 'vsl-marco-2026', true, 450, false, now(), now()),
(gen_random_uuid(), 'Wagner Moreira', 'wagner.m@email.com', '(48) 99234-5678', 'TikTok', 'stage-3', 'user-demo', 'autoconhecimento', NULL, NULL, 9.00, NULL, NULL, NULL, true, 360, false, now(), now()),
(gen_random_uuid(), 'Ximena Castro', 'ximena.c@email.com', NULL, 'Instagram', 'stage-3', 'user-demo', 'busca_espiritual', NULL, NULL, 11.50, NULL, NULL, NULL, true, 300, false, now(), now()),
-- Stage 4 - Participou Online
(gen_random_uuid(), 'Amanda Teixeira', 'amanda.t@email.com', '(48) 99456-7890', 'Instagram', 'stage-4', 'user-demo', 'relacionamento', 'Melhorar meu relacionamento', NULL, 12.00, NULL, NULL, NULL, true, 480, false, now(), now()),
(gen_random_uuid(), 'Bernardo Figueiredo', 'bernardo.f@email.com', '(48) 99567-8901', 'TikTok', 'stage-4', 'user-demo', 'transicao_carreira', 'Quero encontrar minha vocação', NULL, 10.00, NULL, NULL, NULL, true, 400, false, now(), now()),
-- Stage 5 - Participou Presencial
(gen_random_uuid(), 'Daniela Rezende', 'daniela.r@email.com', '(48) 99678-9012', 'Instagram', 'stage-5', 'user-demo', 'busca_espiritual', 'Conhecimento que transforma', NULL, 13.00, NULL, NULL, NULL, true, 480, false, now(), now()),
(gen_random_uuid(), 'Emanuel Cruz', 'emanuel.c@email.com', '(48) 99789-0123', 'YouTube', 'stage-5', 'user-demo', 'paternidade', 'Educação dos filhos', NULL, 18.00, NULL, NULL, NULL, true, 550, false, now(), now()),
-- Stage 6 - Pedido de Curso
(gen_random_uuid(), 'Fernanda Araújo', 'fernanda.a@email.com', '(48) 99890-1234', 'Instagram', 'stage-6', 'user-demo', 'autoconhecimento', 'Quero me conhecer profundamente', NULL, 15.00, NULL, NULL, NULL, true, 500, false, now(), now()),
-- Stage 7 - Ingressou
(gen_random_uuid(), 'Gabriel Nogueira', 'gabriel.n@email.com', '(48) 99901-2345', 'Instagram', 'stage-7', 'user-demo', 'busca_espiritual', 'Encontrei o que buscava', NULL, 12.50, NULL, NULL, NULL, true, 480, false, now(), now()),
(gen_random_uuid(), 'Helena Vieira', 'helena.v@email.com', '(48) 99012-3456', 'TikTok', 'stage-7', 'user-demo', 'crise_pessoal', 'Transformação pessoal', NULL, 11.00, NULL, NULL, NULL, true, 510, false, now(), now());

-- ==========================================
-- 7. Sample Alerts
-- ==========================================
INSERT INTO "alerts" ("id", "type", "channel_id", "message", "is_read", "created_at") VALUES
(gen_random_uuid(), 'ENGAGEMENT_DROP', 'ch-ig', 'Engajamento do Instagram caiu 15% esta semana', false, now()),
(gen_random_uuid(), 'CADENCE_MISS', 'ch-ig', 'Meta de 5 posts/semana no Instagram não atingida (3/5)', true, now());

-- ==========================================
-- 8. Campaigns
-- ==========================================
INSERT INTO "campaigns" ("id", "meta_campaign_id", "channel_id", "name", "status", "objective", "budget", "start_date", "end_date", "created_at") VALUES
('camp-1', 'meta-vsl-marco-2026', 'ch-ig', 'VSL Marco 2026', 'ACTIVE', 'CONVERSIONS', 500, now() - interval '30 days', now() + interval '30 days', now()),
('camp-2', 'meta-carrossel-depoimentos', 'ch-tt', 'Carrossel Depoimentos', 'ACTIVE', 'ENGAGEMENT', 200, now() - interval '14 days', now() + interval '16 days', now());

-- ==========================================
-- 9. Calendar Entries (this week + next week)
-- ==========================================
INSERT INTO "content_calendar_entries" ("id", "title", "channel_id", "category", "content_theme", "content_format", "assignee_id", "status", "scheduled_date", "created_at", "updated_at") VALUES
(gen_random_uuid(), 'Reel — Depoimento aluno', 'ch-ig', 'TESTIMONY', 'EXPERIENCIA', 'REEL', 'user-marcos', 'PUBLISHED', CURRENT_DATE, now(), now()),
(gen_random_uuid(), 'Post — Frase de González Pecotche', 'ch-ig', 'EDUCATIONAL', 'ENSINAMENTO', 'FEED_POST', 'user-demo', 'CREATED', CURRENT_DATE + 1, now(), now()),
(gen_random_uuid(), 'Story — Bastidores atividade', 'ch-ig', 'INSTITUTIONAL', 'DIVULGACAO', 'STORY', 'user-demo', 'CREATED', CURRENT_DATE + 1, now(), now()),
(gen_random_uuid(), 'TikTok — Dica de leitura', 'ch-tt', 'EDUCATIONAL', 'DICA_LEITURA', 'REEL', 'user-demo', 'PLANNED', CURRENT_DATE + 2, now(), now()),
(gen_random_uuid(), 'Post — Convite atividade online', 'ch-ig', 'INVITE', 'CONVITE', 'FEED_POST', 'user-marcos', 'PLANNED', CURRENT_DATE + 3, now(), now()),
(gen_random_uuid(), 'Reforço — Lembrete atividade sábado', 'ch-ig', 'INVITE', 'REFORCO_CONVITE', 'STORY', 'user-demo', 'PLANNED', CURRENT_DATE + 4, now(), now()),
(gen_random_uuid(), 'YouTube — Palestra completa', 'ch-yt', 'EDUCATIONAL', 'ENSINAMENTO', 'VIDEO_LONGO', 'user-demo', 'PLANNED', CURRENT_DATE + 5, now(), now()),
(gen_random_uuid(), 'TikTok — Trecho de palestra', 'ch-tt', 'EDUCATIONAL', 'PODCAST', 'REEL', 'user-demo', 'PLANNED', CURRENT_DATE + 5, now(), now()),
(gen_random_uuid(), 'Post — Reflexão semanal', 'ch-ig', 'EDUCATIONAL', 'ENSINAMENTO', 'FEED_POST', 'user-marcos', 'PLANNED', CURRENT_DATE + 7, now(), now()),
(gen_random_uuid(), 'Reel — Antes e depois aluno', 'ch-ig', 'TESTIMONY', 'EXPERIENCIA', 'REEL', 'user-demo', 'PLANNED', CURRENT_DATE + 8, now(), now()),
(gen_random_uuid(), 'Post — Convite atividade presencial', 'ch-ig', 'INVITE', 'CONVITE', 'FEED_POST', 'user-demo', 'PLANNED', CURRENT_DATE + 9, now(), now()),
(gen_random_uuid(), 'TikTok — Pergunta do dia', 'ch-tt', 'INSTITUTIONAL', 'OUTRO', 'REEL', 'user-marcos', 'PLANNED', CURRENT_DATE + 10, now(), now());

-- ==========================================
-- Done! Login: demo@logosofia.org.br / demo1234
-- ==========================================
