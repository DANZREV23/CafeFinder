import { prisma } from '../../config/database.js';
import { IEmailProvider } from './provider.interface.js';
import { SmtpProvider } from './smtp.provider.ts';
import { ConsoleProvider } from './console.provider.ts';
import { EmailTemplate, EmailPayloads } from './types.js';
import { EmailJobStatus } from '@prisma/client';
import { renderTemplate } from './templates.ts';

export class EmailService {
  private provider: IEmailProvider;
  private isEnabled: boolean;
  private fromName: string;
  private fromAddress: string;
  private replyTo?: string;
  private baseUrl: string;

  constructor() {
    this.isEnabled = process.env.EMAIL_ENABLED === 'true';
    this.fromName = process.env.EMAIL_FROM_NAME || 'CafeFinder';
    this.fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@cafefinder.com';
    this.replyTo = process.env.EMAIL_REPLY_TO;
    const PORT = process.env.PORT || 3000;
    this.baseUrl = process.env.EMAIL_BASE_URL || process.env.APP_URL || `http://localhost:${PORT}`;

    const providerType = process.env.EMAIL_PROVIDER || 'console';
    
    if (providerType === 'smtp' && this.isEnabled) {
      this.provider = new SmtpProvider();
    } else {
      this.provider = new ConsoleProvider();
    }
  }

  /**
   * Main method to queue a transactional email.
   * This saves the job to the database for asynchronous processing.
   */
  async queueEmail<T extends EmailTemplate>(
    template: T,
    toAddress: string,
    payload: EmailPayloads[T],
    userId?: string
  ) {
    if (!toAddress) {
      console.warn(`[EmailService]: No recipient address provided for template ${template}`);
      return null;
    }

    // Render template to get subject
    const { subject } = renderTemplate(template, payload);

    try {
      const job = await prisma.emailJob.create({
        data: {
          template,
          toAddress,
          subject,
          payload: payload as any,
          userId,
          status: EmailJobStatus.PENDING,
          availableAt: new Date(),
        },
      });

      // Attempt to send immediately in background without blocking
      if (this.isEnabled) {
        this.processJob(job.id).catch(err => {
          console.error(`[EmailService]: Background job processing failed for ${job.id}:`, err);
        });
      }

      return job;
    } catch (error) {
      console.error('[EmailService]: Failed to queue email job:', error);
      return null;
    }
  }

  /**
   * Process a single email job.
   */
  async processJob(jobId: string) {
    const job = await prisma.emailJob.findUnique({
      where: { id: jobId }
    });

    if (!job || job.status === EmailJobStatus.SENT || job.status === EmailJobStatus.CANCELLED) {
      return;
    }

    // Update status to processing
    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: EmailJobStatus.PROCESSING }
    });

    try {
      const { html, text, subject } = renderTemplate(job.template as EmailTemplate, job.payload);

      const result = await this.provider.send({
        to: job.toAddress,
        subject: job.subject || subject,
        html,
        text,
        replyTo: this.replyTo,
        from: {
          name: this.fromName,
          address: this.fromAddress,
        },
      });

      if (result.success) {
        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: EmailJobStatus.SENT,
            sentAt: new Date(),
            providerMessageId: result.providerMessageId,
            attempts: job.attempts + 1,
          }
        });
      } else {
        const nextAttempt = new Date();
        const delayMinutes = Math.pow(2, job.attempts + 1); // Exponential backoff: 2, 4, 8...
        nextAttempt.setMinutes(nextAttempt.getMinutes() + delayMinutes);

        await prisma.emailJob.update({
          where: { id: jobId },
          data: {
            status: job.attempts >= 5 ? EmailJobStatus.FAILED : EmailJobStatus.PENDING,
            attempts: job.attempts + 1,
            lastError: result.error,
            availableAt: nextAttempt,
          }
        });
      }
    } catch (error: any) {
      console.error(`[EmailService]: Unexpected error processing job ${jobId}:`, error);
      await prisma.emailJob.update({
        where: { id: jobId },
        data: {
          status: EmailJobStatus.FAILED,
          lastError: error.message || 'Unexpected error',
          attempts: job.attempts + 1,
        }
      });
    }
  }

  /**
   * Helper methods for specific workflows
   */

  async sendWelcomeEmail(user: { id: string; name: string; email: string }) {
    return this.queueEmail(EmailTemplate.WELCOME, user.email, {
      name: user.name,
      exploreUrl: `${this.baseUrl}/cafes`,
    }, user.id);
  }

  async sendCafeSubmissionApprovedEmail(user: { id: string; name: string; email: string }, cafe: { name: string; slug: string }) {
    return this.queueEmail(EmailTemplate.CAFE_SUBMISSION_APPROVED, user.email, {
      name: user.name,
      cafeName: cafe.name,
      cafeUrl: `${this.baseUrl}/cafes/${cafe.slug}`,
    }, user.id);
  }

  async sendCafeSubmissionRejectedEmail(user: { id: string; name: string; email: string }, cafeName: string, reason: string) {
    return this.queueEmail(EmailTemplate.CAFE_SUBMISSION_REJECTED, user.email, {
      name: user.name,
      cafeName,
      reason,
    }, user.id);
  }

  async sendOwnerClaimApprovedEmail(user: { id: string; name: string; email: string }, cafeName: string) {
    return this.queueEmail(EmailTemplate.OWNER_CLAIM_APPROVED, user.email, {
      name: user.name,
      cafeName,
      dashboardUrl: `${this.baseUrl}/owner`,
    }, user.id);
  }

  async sendOwnerClaimRejectedEmail(user: { id: string; name: string; email: string }, cafeName: string, reason: string) {
    return this.queueEmail(EmailTemplate.OWNER_CLAIM_REJECTED, user.email, {
      name: user.name,
      cafeName,
      reason,
    }, user.id);
  }

  async sendReviewApprovedEmail(user: { id: string; name: string; email: string }, cafe: { name: string; slug: string }) {
    return this.queueEmail(EmailTemplate.REVIEW_APPROVED, user.email, {
      name: user.name,
      cafeName: cafe.name,
      cafeUrl: `${this.baseUrl}/cafes/${cafe.slug}`,
    }, user.id);
  }

  async sendReviewRejectedEmail(user: { id: string; name: string; email: string }, cafeName: string, reason?: string) {
    return this.queueEmail(EmailTemplate.REVIEW_REJECTED, user.email, {
      name: user.name,
      cafeName,
      reason,
    }, user.id);
  }

  async sendChangeRequestApprovedEmail(user: { id: string; name: string; email: string }, cafeName: string, changeType: string) {
    return this.queueEmail(EmailTemplate.CHANGE_REQUEST_APPROVED, user.email, {
      name: user.name,
      cafeName,
      changeType,
      dashboardUrl: `${this.baseUrl}/owner`,
    }, user.id);
  }

  async sendChangeRequestRejectedEmail(user: { id: string; name: string; email: string }, cafeName: string, changeType: string, reason?: string) {
    return this.queueEmail(EmailTemplate.CHANGE_REQUEST_REJECTED, user.email, {
      name: user.name,
      cafeName,
      changeType,
      reason,
      dashboardUrl: `${this.baseUrl}/owner`,
    }, user.id);
  }
}

export const emailService = new EmailService();
