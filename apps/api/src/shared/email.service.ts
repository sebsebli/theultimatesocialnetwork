import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { signInTokenTemplates } from './email-templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT') || '587';
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured. Email sending will be disabled.');
      this.logger.warn('Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable email.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port),
      secure: secure, // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass,
      },
    });

    this.logger.log(`Email service initialized with ${host}:${port}`);
  }

  async sendSignInToken(email: string, token: string, lang: string = 'en'): Promise<boolean> {
    const t = signInTokenTemplates[lang] || signInTokenTemplates['en'];
    const subject = t.subject || 'Your Sign In Code - Cite System';

    if (!this.transporter) {
      // In development, log the token
      this.logger.warn(`[MOCK EMAIL] Sign In Token for ${email} (${lang}): ${token}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || '"Cite System" <noreply@cite.com>',
        to: email,
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Cite System</h1>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">${t.title}</h2>
                <p style="color: #666; font-size: 16px;">${t.body}</p>
                <div style="text-align: center; margin: 40px 0;">
                  <span style="display: inline-block; background: #f4f4f5; color: #333; padding: 12px 24px; border-radius: 8px; font-family: monospace; font-size: 32px; letter-spacing: 4px; font-weight: 700; border: 1px solid #e4e4e7;">${token}</span>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">
                  ${t.tokenLabel}
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                  ${t.ignore}
                </p>
              </div>
            </body>
          </html>
        `,
        text: `
${t.title}

${t.body}

${token}

${t.ignore}
        `.trim(),
      });

      this.logger.log(`Sign in token sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send sign in token to ${email}:`, error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string, attachments?: Array<{ filename: string; content: Buffer }>): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM') || '"Cite System" <noreply@cite.com>',
        to: to,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''),
        attachments: attachments,
      });

      this.logger.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
