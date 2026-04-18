/**
 * Form Submission Notification Email Template
 */

interface FormSubmissionParams {
  formTitle: string;
  leadName: string;
  leadEmail: string | null;
  submissionId: string;
}

export function formSubmissionSubject(params: FormSubmissionParams): string {
  return `Nova submissão: ${params.formTitle}`;
}

export function formSubmissionHtml(params: FormSubmissionParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background-color: #E8792A; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nova Submissão de Formulário</h1>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Um novo lead preencheu o formulário <strong>${params.formTitle}</strong>.
      </p>

      <div style="background-color: #FDF2E9; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h2 style="color: #E8792A; font-size: 18px; margin: 0 0 12px 0;">Dados do Lead</h2>
        <p style="color: #333333; font-size: 14px; margin: 0;">
          <strong>Nome:</strong> ${params.leadName}<br>
          ${params.leadEmail ? `<strong>Email:</strong> ${params.leadEmail}<br>` : ''}
          <strong>ID da Submissão:</strong> ${params.submissionId}
        </p>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
        Acesse o painel administrativo para ver todos os detalhes da submissão e gerenciar este lead.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f5f5f5; padding: 16px; text-align: center;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        Esta é uma notificação automática do sistema de formulários.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export function formSubmissionText(params: FormSubmissionParams): string {
  return `
Nova Submissão de Formulário

Um novo lead preencheu o formulário "${params.formTitle}".

Dados do Lead:
- Nome: ${params.leadName}
${params.leadEmail ? `- Email: ${params.leadEmail}` : ''}
- ID da Submissão: ${params.submissionId}

Acesse o painel administrativo para ver todos os detalhes.
`.trim();
}
