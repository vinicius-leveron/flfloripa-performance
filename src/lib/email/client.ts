/**
 * Email Client (Resend)
 *
 * Handles transactional emails for webinar notifications.
 */

import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get the from email address
 */
export function getFromEmail(): string {
  return process.env.EMAIL_FROM || 'noreply@flfloripa.org.br';
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    console.warn('[Email] Resend not configured, skipping email send');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const client = getClient();
    const { data, error } = await client.emails.send({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error('[Email] Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Exception sending email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send batch emails (for reminders)
 */
export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; html: string }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { sent, failed };
}
