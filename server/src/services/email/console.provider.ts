import { IEmailProvider } from './provider.interface.js';
import { EmailOptions, EmailSendResult } from './types.js';

export class ConsoleProvider implements IEmailProvider {
  async send(options: EmailOptions): Promise<EmailSendResult> {
    console.log('--- EMAIL SENT (CONSOLE) ---');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${options.from?.name} <${options.from?.address}>`);
    console.log('--- TEXT CONTENT ---');
    console.log(options.text);
    console.log('--- HTML CONTENT (TRUNCATED) ---');
    console.log(options.html.substring(0, 200) + '...');
    console.log('----------------------------');

    return {
      success: true,
      providerMessageId: `console-${Date.now()}`,
    };
  }

  getName(): string {
    return 'CONSOLE';
  }
}
