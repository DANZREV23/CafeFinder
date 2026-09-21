import { EmailOptions, EmailSendResult } from './types.js';

export interface IEmailProvider {
  send(options: EmailOptions): Promise<EmailSendResult>;
  getName(): string;
}
