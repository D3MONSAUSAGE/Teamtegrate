import { Resend } from 'resend';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
}

class ResendEmailAdapter {
  private resend: Resend | null = null;
  private defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.defaultFrom = process.env.BRAND_NAME 
      ? `${process.env.BRAND_NAME} <notifications@teamtegrate.com>`
      : 'Teamtegrate <notifications@teamtegrate.com>';
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn('[Email] RESEND_API_KEY not configured, email notifications disabled');
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailSendResult> {
    if (!this.resend) {
      console.warn('[Email] Resend not configured, skipping email notification');
      return { success: false, error: 'Resend not configured' };
    }

    try {
      const result = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html
      });

      if (result.error) {
        console.error('[Email] Failed to send email:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('[Email] Email sent successfully:', result.data?.id);
      return { success: true, id: result.data?.id };
    } catch (error: any) {
      console.error('[Email] Error sending email:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<EmailSendResult[]> {
    const results: EmailSendResult[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }
    
    return results;
  }
}

export const resendAdapter = new ResendEmailAdapter();