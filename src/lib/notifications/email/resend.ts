import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Resend] API key not configured, skipping email');
      return { ok: false, error: 'RESEND_API_KEY not configured' };
    }

    const from = options.from || 'Teamtegrate Support <support@requests.teamtegrate.com>';
    
    const result = await resend.emails.send({
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text
    });

    console.log('[Resend] Email sent successfully:', {
      id: result.data?.id,
      to: options.to,
      subject: options.subject
    });

    return { ok: true, id: result.data?.id ?? null };
  } catch (error: any) {
    console.error('[Resend] Failed to send email:', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });

    return { ok: false, error: String(error.message || error) };
  }
}