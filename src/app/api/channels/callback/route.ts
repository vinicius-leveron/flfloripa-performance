import { NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/api-error';

interface OAuthState {
  platform: 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN';
  userId: string;
}

async function exchangeCodeForToken(platform: string, code: string, redirectUri: string) {
  const clientId = process.env[`${platform}_CLIENT_ID`] || '';
  const clientSecret = process.env[`${platform}_CLIENT_SECRET`] || '';

  const tokenUrls: Record<string, string> = {
    INSTAGRAM: 'https://graph.facebook.com/v21.0/oauth/access_token',
    TIKTOK: 'https://open.tiktokapis.com/v2/oauth/token/',
    LINKEDIN: 'https://www.linkedin.com/oauth/v2/accessToken',
  };

  const response = await fetch(tokenUrls[platform], {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
  });

  if (!response.ok) throw new AppError('EXTERNAL_API_ERROR', `Falha ao trocar código OAuth com ${platform}`, 502);
  return response.json();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) return NextResponse.redirect(new URL('/settings/channels?error=oauth_denied', request.url));
    if (!code || !stateParam) throw new AppError('VALIDATION_ERROR', 'Código ou state ausente', 400);

    const state: OAuthState = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/channels/callback`;
    const tokenData = await exchangeCodeForToken(state.platform, code, redirectUri);

    const { prisma } = await import('@/lib/prisma');

    await prisma.channel.upsert({
      where: { id: `${state.platform}-${state.userId}` },
      create: {
        platform: state.platform, accountName: tokenData.name || state.platform.toLowerCase(),
        accountId: tokenData.open_id || tokenData.user_id || tokenData.id || '',
        accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        status: 'CONNECTED', userId: state.userId,
      },
      update: {
        accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        status: 'CONNECTED',
      },
    });

    return NextResponse.redirect(new URL('/settings/channels?success=true', request.url));
  } catch (error) {
    return handleApiError(error);
  }
}
