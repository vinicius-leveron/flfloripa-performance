import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

const connectSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'LINKEDIN', 'YOUTUBE']),
});

const OAUTH_CONFIGS = {
  INSTAGRAM: {
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    scope: 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement',
  },
  TIKTOK: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    scope: 'user.info.basic,video.list',
  },
  LINKEDIN: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'r_organization_social,r_organization_admin',
  },
  YOUTUBE: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
  },
} as const;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const body = await request.json();
    const { platform } = connectSchema.parse(body);

    const config = OAUTH_CONFIGS[platform];
    const clientId = platform === 'YOUTUBE'
      ? (process.env.GOOGLE_CLIENT_ID || '')
      : (process.env[`${platform}_CLIENT_ID`] || '');
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/channels/callback`;

    const state = Buffer.from(JSON.stringify({
      platform,
      userId: session.user.id,
    })).toString('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: config.scope,
      response_type: 'code',
      state,
    });

    if (platform === 'YOUTUBE') {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;

    return NextResponse.json({ data: { authUrl } });
  } catch (error) {
    return handleApiError(error);
  }
}
