-- ============================================
-- FLFloripa Performance — Seed Data
-- ============================================
-- Execute após schema.sql
-- ============================================

-- Funnel Stages (7 estágios do funil de ingresso logosófico)
INSERT INTO funnel_stages (id, name, position, description, source) VALUES
  ('stage-1', 'Impactado', 1, 'Viu o criativo/anúncio nas redes sociais', 'AUTO'),
  ('stage-2', 'Visitou VSL', 2, 'Clicou e assistiu a VSL na landing page', 'AUTO'),
  ('stage-3', 'Inscrito Atividade', 3, 'Preencheu formulário para atividade online', 'MANUAL'),
  ('stage-4', 'Participou Online', 4, 'Compareceu à atividade online ao vivo', 'MANUAL'),
  ('stage-5', 'Participou Presencial', 5, 'Veio à atividade presencial na sede', 'MANUAL'),
  ('stage-6', 'Pedido de Curso', 6, 'Solicitou ingresso no curso de formação', 'MANUAL'),
  ('stage-7', 'Ingressou', 7, 'Efetivou ingresso na Fundação Logosófica', 'MANUAL')
ON CONFLICT (id) DO NOTHING;

-- Cadence Goals (metas de posts por semana por plataforma)
INSERT INTO cadence_goals (id, platform, posts_per_week) VALUES
  (generate_cuid(), 'INSTAGRAM', 5),
  (generate_cuid(), 'TIKTOK', 3),
  (generate_cuid(), 'LINKEDIN', 2),
  (generate_cuid(), 'YOUTUBE', 1)
ON CONFLICT (platform) DO NOTHING;

-- Alert Thresholds (limites para alertas automáticos)
INSERT INTO alert_thresholds (id, metric_name, drop_percentage) VALUES
  (generate_cuid(), 'engagement', 20),
  (generate_cuid(), 'reach', 30),
  (generate_cuid(), 'impressions', 25)
ON CONFLICT (metric_name) DO NOTHING;
