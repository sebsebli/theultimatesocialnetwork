import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { signInTokenTemplates, inviteCodeTemplates } from './email-templates';
import { buildEmailHtml } from './email-layout';

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
      this.logger.warn(
        'Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable email.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port),
      secure: secure,
      auth: { user, pass },
    });

    this.logger.log(`Email service initialized with ${host}:${port}`);
  }

  async sendSignInToken(
    email: string,
    token: string,
    lang: string = 'en',
  ): Promise<boolean> {
    const t = signInTokenTemplates[lang] || signInTokenTemplates['en'];
    const subject = t.subject ?? 'Your verification code – Cite';

    if (!this.transporter) {
      this.logger.warn(
        `[MOCK EMAIL] Sign In Token for ${email} (${lang}): ${token}`,
      );
      return false;
    }

    const bodyHtml = `<p style="margin:0 0 12px 0;color:#A8A8AA;font-size:16px;line-height:1.6;">${t.body}</p><p style="margin:0;color:#6E6E73;font-size:14px;">${t.tokenLabel}</p>`;
    const html = buildEmailHtml({
      title: t.title,
      bodyHtml,
      code: token,
      footerText: t.ignore,
      baseUrl: this.configService.get<string>('FRONTEND_URL') || undefined,
      companyName:
        this.configService.get<string>('EMAIL_COMPANY_NAME') || 'Cite',
      companyAddress:
        this.configService.get<string>('EMAIL_COMPANY_ADDRESS') || undefined,
    });
    const text = [t.title, t.body, t.tokenLabel, token, t.ignore].join('\n\n');

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Cite" <noreply@cite.com>',
        to: email,
        subject,
        html,
        text,
      });
      this.logger.log(`Sign in token sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send sign in token to ${email}:`, error);
      throw error;
    }
  }

  async sendInviteCode(
    to: string,
    code: string,
    lang: string = 'en',
  ): Promise<boolean> {
    const t = inviteCodeTemplates[lang] || inviteCodeTemplates['en'];
    const subject = t.subject;

    if (!this.transporter) {
      this.logger.warn(`[MOCK EMAIL] Invite code for ${to} (${lang}): ${code}`);
      return false;
    }

    const bodyHtml = `<p style="margin:0;color:#A8A8AA;font-size:16px;line-height:1.6;">${t.body}</p>`;
    const html = buildEmailHtml({
      title: t.title,
      bodyHtml,
      code,
      footerText: t.footer,
      baseUrl: this.configService.get<string>('FRONTEND_URL') || undefined,
      companyName:
        this.configService.get<string>('EMAIL_COMPANY_NAME') || 'Cite',
      companyAddress:
        this.configService.get<string>('EMAIL_COMPANY_ADDRESS') || undefined,
    });
    const text = [t.title, t.body, code, t.footer].join('\n\n');

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Cite" <noreply@cite.com>',
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Invite code sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send invite code to ${to}:`, error);
      throw error;
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    attachments?: Array<{ filename: string; content: Buffer }>,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Cite System" <noreply@cite.com>',
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
