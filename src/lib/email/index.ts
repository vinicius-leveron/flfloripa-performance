/**
 * Email Module (Resend)
 *
 * Transactional emails for webinar notifications.
 */

export * from './client';

// Templates
export * from './templates/webinar-confirmation';
export * from './templates/webinar-reminder';
export * from './templates/webinar-replay';

// Convenience functions for sending webinar emails
import { sendEmail, isEmailConfigured } from './client';
import {
  webinarConfirmationSubject,
  webinarConfirmationHtml,
  webinarConfirmationText,
} from './templates/webinar-confirmation';
import {
  webinarReminderSubject,
  webinarReminderHtml,
  webinarReminderText,
} from './templates/webinar-reminder';
import {
  webinarReplaySubject,
  webinarReplayHtml,
  webinarReplayText,
} from './templates/webinar-replay';

interface WebinarEmailParams {
  leadName: string;
  leadEmail: string;
  webinarTitle: string;
  webinarDate: Date;
  webinarDescription?: string;
}

/**
 * Send webinar confirmation email
 */
export async function sendWebinarConfirmation(params: WebinarEmailParams) {
  if (!isEmailConfigured()) {
    console.warn('[Email] Skipping confirmation email - not configured');
    return { success: false, error: 'Not configured' };
  }

  return sendEmail({
    to: params.leadEmail,
    subject: webinarConfirmationSubject(params),
    html: webinarConfirmationHtml(params),
    text: webinarConfirmationText(params),
  });
}

/**
 * Send webinar reminder email (24h before)
 */
export async function sendWebinarReminder(params: WebinarEmailParams & { webinarUrl?: string }) {
  if (!isEmailConfigured()) {
    console.warn('[Email] Skipping reminder email - not configured');
    return { success: false, error: 'Not configured' };
  }

  return sendEmail({
    to: params.leadEmail,
    subject: webinarReminderSubject(params),
    html: webinarReminderHtml(params),
    text: webinarReminderText(params),
  });
}

/**
 * Send webinar replay email
 */
export async function sendWebinarReplay(params: {
  leadName: string;
  leadEmail: string;
  webinarTitle: string;
  replayUrl: string;
  expiresAt?: Date;
}) {
  if (!isEmailConfigured()) {
    console.warn('[Email] Skipping replay email - not configured');
    return { success: false, error: 'Not configured' };
  }

  return sendEmail({
    to: params.leadEmail,
    subject: webinarReplaySubject(params),
    html: webinarReplayHtml(params),
    text: webinarReplayText(params),
  });
}
