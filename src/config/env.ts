import { z } from 'zod';

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters'),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),

  // Google OAuth (optional — Google provider is conditionally enabled)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Social platform OAuth (optional — configured per channel)
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),

  // Cron job auth
  CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

export const env = envSchema.parse(process.env);
