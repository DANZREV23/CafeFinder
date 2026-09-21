import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { IEmailProvider } from './provider.interface.js';
import { EmailOptions, EmailSendResult } from './types.js';

export class SmtpProvider implements IEmailProvider {
  private transporter: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(options: EmailOptions): Promise<EmailSendResult> {
    try {
      const info = await this.transporter.sendMail({
        from: options.from ? `${options.from.name} <${options.from.address}>` : undefined,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });

      return {
        success: true,
        providerMessageId: info.messageId,
      };
    } catch (error: any) {
      console.error('[SmtpProvider]: Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  getName(): string {
    return 'SMTP';
  }
}
