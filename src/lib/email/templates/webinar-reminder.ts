/**
 * Webinar Reminder Email Template
 *
 * Sent 24 hours before the webinar.
 */

interface WebinarReminderParams {
  leadName: string;
  webinarTitle: string;
  webinarDate: Date;
  webinarUrl?: string;
}

export function webinarReminderSubject(params: WebinarReminderParams): string {
  return `Lembrete: ${params.webinarTitle} - Amanhã!`;
}

export function webinarReminderHtml(params: WebinarReminderParams): string {
  const dateStr = params.webinarDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  const accessButton = params.webinarUrl
    ? `<a href="${params.webinarUrl}" class="btn">Acessar Webinar</a>`
    : '<p style="color: #64748b; font-style: italic;">O link de acesso será enviado em breve.</p>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembrete de Webinar</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-radius: 0 0 8px 8px; }
    .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    h1 { margin: 0; font-size: 24px; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Amanhã tem Webinar!</h1>
    </div>
    <div class="content">
      <p>Olá, <strong>${params.leadName}</strong>!</p>

      <p>Este é um lembrete que o webinar para o qual você se inscreveu acontece <strong>amanhã</strong>.</p>

      <div class="highlight">
        <p style="margin: 0;"><strong>${params.webinarTitle}</strong></p>
        <p style="margin: 10px 0 0 0; color: #64748b;">${dateStr}</p>
      </div>

      ${accessButton}

      <p style="margin-top: 30px;">Não perca! Sua presença é muito importante.</p>

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

export function webinarReminderText(params: WebinarReminderParams): string {
  const dateStr = params.webinarDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

  return `
Amanhã tem Webinar!

Olá, ${params.leadName}!

Este é um lembrete que o webinar para o qual você se inscreveu acontece amanhã.

${params.webinarTitle}
${dateStr}

${params.webinarUrl ? `Acessar: ${params.webinarUrl}` : 'O link de acesso será enviado em breve.'}

Não perca! Sua presença é muito importante.

Equipe Fundação Logosófica de Florianópolis
`;
}
