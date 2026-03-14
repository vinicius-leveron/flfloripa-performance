import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const key = supabaseServiceKey || supabaseAnonKey;

  console.log('[Supabase] Init:', {
    hasUrl: !!supabaseUrl,
    urlPrefix: supabaseUrl.substring(0, 30),
    hasServiceKey: !!supabaseServiceKey,
    hasAnonKey: !!supabaseAnonKey,
  });

  if (!supabaseUrl || !key) {
    throw new Error(`Missing Supabase config: URL=${!!supabaseUrl}, KEY=${!!key}`);
  }

  _supabase = createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _supabase;
}

// Types for database tables (based on Prisma schema)
export type User = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  image: string | null;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  created_at: string;
  updated_at: string;
};

export type FunnelStage = {
  id: string;
  name: string;
  position: number;
  description: string | null;
  source: 'AUTO' | 'MANUAL';
  created_at: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  channel_origin: string | null;
  current_stage_id: string;
  registered_by_id: string;
  notes: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  life_moment: string | null;
  inquiry: string | null;
  source: string | null;
  campaign_id: string | null;
  ad_spend: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  vsl_watched: boolean;
  vsl_watch_time: number | null;
};

export type Channel = {
  id: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN' | 'YOUTUBE';
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  user_id: string;
  last_sync_at: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  meta_campaign_id: string;
  channel_id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  objective: string | null;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};
