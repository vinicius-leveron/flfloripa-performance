-- ============================================
-- FLFloripa Performance — Seed Data
-- ============================================
-- Execute após schema.sql
-- ============================================

-- Funnel Stages (6 estágios do funil de conversão)
INSERT INTO funnel_stages (id, name, position, description, source) VALUES
  ('stage-1', 'Alcance', 1, 'Impressões e views nas redes sociais', 'AUTO'),
  ('stage-2', 'Engajamento', 2, 'Likes, comentários, shares, saves', 'AUTO'),
  ('stage-3', 'Interesse', 3, 'Cliques em links, visitas ao perfil, DMs', 'AUTO'),
  ('stage-4', 'Consideração', 4, 'Cadastro em webinar ou conteúdo especial', 'MANUAL'),
  ('stage-5', 'Conversão', 5, 'Comparecimento à reunião presencial', 'MANUAL'),
  ('stage-6', 'Retenção', 6, 'Retorno e fidelização como membro', 'MANUAL')
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
