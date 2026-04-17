/**
 * Webinar Replay Email Template
 *
 * Sent when replay becomes available.
 */

interface WebinarReplayParams {
  leadName: string;
  webinarTitle: string;
  replayUrl: string;
  expiresAt?: Date;
}

export function webinarReplaySubject(params: WebinarReplayParams): string {
  return `Replay disponível: ${params.webinarTitle}`;
}

export function webinarReplayHtml(params: WebinarReplayParams): string {
  const expiresText = params.expiresAt
    ? `<p style="color: #dc2626; font-size: 14px;">O replay estará disponível até ${params.expiresAt.toLocaleDateString('pt-BR')}.</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Replay Disponível</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    h1 { margin: 0; font-size: 24px; }
    .btn { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; }
    .btn:hover { background: #059669; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Replay Disponível!</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${params.leadName}</strong>!</p>

      <p>O replay do webinar <strong>${params.webinarTitle}</strong> já está disponível.</p>

      <div class="highlight">
        <a href="${params.replayUrl}" class="btn">Assistir Replay</a>
        ${expiresText}
      </div>

      <p>Se você participou ao vivo, aproveite para rever os pontos mais importantes. Se não pôde comparecer, esta é sua chance de assistir!</p>

      <p>Após assistir, se tiver interesse em conhecer mais sobre a Fundação Logosófica, você pode agendar uma visita à nossa sede.</p>

      <p><em>Equipe Fundação Logosófica de Florianópolis</em></p>
    </div>
    <div class="footer">
      <p>Fundação Logosófica de Florianópolis</p>
      <p>Este email foi enviado porque você se inscreveu em um webinar.</p>
    </div>
  </div>
</body>
</html>
`;
}

export function webinarReplayText(params: WebinarReplayParams): string {
  const expiresText = params.expiresAt
    ? `O replay estará disponível até ${params.expiresAt.toLocaleDateString('pt-BR')}.`
    : '';

  return `
Replay Disponível!

Olá, ${params.leadName}!

O replay do webinar "${params.webinarTitle}" já está disponível.

Assistir: ${params.replayUrl}
${expiresText}

Se você participou ao vivo, aproveite para rever os pontos mais importantes. Se não pôde comparecer, esta é sua chance de assistir!

Após assistir, se tiver interesse em conhecer mais sobre a Fundação Logosófica, você pode agendar uma visita à nossa sede.

Equipe Fundação Logosófica de Florianópolis
`;
}
