import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  signInTokenTemplates,
  inviteCodeTemplates,
  accountDeletionTemplates,
  dataExportTemplates,
} from './email-templates';
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
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new Error(
          'SMTP configuration is missing in production. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
        );
      }
      this.logger.warn(
        'SMTP not configured. Email sending will be disabled (DEV mode).',
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
    const subject = t.subject ?? 'Your verification code – Citewalk';

    if (!this.transporter) {
      this.logger.warn(
        `[DEV] Email suppressed (SMTP not configured). To: ${email}, Token: ${token}`,
      );
      return false;
    }

    const bodyHtml = `<p style="margin:0 0 12px 0;color:#A8A8AA;font-size:16px;line-height:1.6;">${t.body}</p><p style="margin:0;color:#6E6E73;font-size:14px;">${t.tokenLabel}</p>`;
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || undefined;
    const html = buildEmailHtml({
      title: t.title,
      bodyHtml,
      code: token,
      footerText: t.ignore,
      baseUrl,
      companyName:
        this.configService.get<string>('EMAIL_COMPANY_NAME') || 'Citewalk',
      companyAddress:
        this.configService.get<string>('EMAIL_COMPANY_ADDRESS') || undefined,
      unsubscribeUrl:
        this.configService.get<string>('EMAIL_PREFERENCES_URL') || undefined,
      reasonText:
        'You received this email because you have a Citewalk account or requested to sign in.',
    });
    const text = [t.title, t.body, t.tokenLabel, token, t.ignore].join('\n\n');

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Citewalk" <noreply@citewalk.com>',
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
    inviterName?: string,
  ): Promise<boolean> {
    const t = inviteCodeTemplates[lang] || inviteCodeTemplates['en'];
    const subject =
      t?.subject ?? "You're invited to join Citewalk — here's your invite code";
    const title = t?.title ?? "You're invited to Citewalk";
    const bodyGeneric =
      t?.bodyGeneric ??
      "You've been invited to join Citewalk as one of the first beta testers.";
    const bodyWithInviter =
      t?.bodyWithInviter ?? '{{inviterName}} has invited you to join Citewalk.';
    const codeLabel = t?.codeLabel ?? 'Your invitation code';
    const instructions =
      t?.instructions ??
      'Enter this code when you sign up in the Citewalk app or on the website.';
    const footer =
      t?.footer ?? "If you didn't expect this email, you can safely ignore it.";

    if (!this.transporter) {
      this.logger.warn(
        `[DEV] Email suppressed (SMTP not configured). To: ${to}, Code: ${code}`,
      );
      return false;
    }

    const bodyLine1 = inviterName
      ? bodyWithInviter.replace(/\{\{inviterName\}\}/g, inviterName)
      : bodyGeneric;
    const bodyHtml = [
      `<p style="margin:0 0 12px 0;color:#A8A8AA;font-size:16px;line-height:1.6;">${bodyLine1}</p>`,
      `<p style="margin:0 0 8px 0;color:#6E6E73;font-size:14px;">${codeLabel}</p>`,
      `<p style="margin:0 0 12px 0;color:#A8A8AA;font-size:14px;line-height:1.5;">${instructions}</p>`,
    ].join('');
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || undefined;
    const html = buildEmailHtml({
      title,
      bodyHtml,
      code,
      footerText: footer,
      baseUrl,
      companyName:
        this.configService.get<string>('EMAIL_COMPANY_NAME') || 'Citewalk',
      companyAddress:
        this.configService.get<string>('EMAIL_COMPANY_ADDRESS') || undefined,
      unsubscribeUrl:
        this.configService.get<string>('EMAIL_PREFERENCES_URL') || undefined,
      reasonText:
        'You received this email because you were invited to join Citewalk.',
    });
    const text = [title, bodyLine1, codeLabel, code, instructions, footer].join(
      '\n\n',
    );

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Citewalk" <noreply@citewalk.com>',
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

  async sendAccountDeletionConfirmation(
    to: string,
    confirmUrl: string,
    reason: string | null,
    lang: string = 'en',
  ): Promise<boolean> {
    const t = accountDeletionTemplates[lang] || accountDeletionTemplates['en'];
    const subject = t.subject;

    if (!this.transporter) {
      this.logger.warn(
        `[DEV] Email suppressed (SMTP not configured). To: ${to}, Confirm URL: ${confirmUrl}`,
      );
      return false;
    }

    const safeReason =
      reason && reason.trim()
        ? reason
            .trim()
            .slice(0, 500)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
        : '';
    const reasonBlock = safeReason
      ? `<p style="margin:12px 0 0 0;color:#6E6E73;font-size:14px;line-height:1.5;"><strong>Your reason:</strong> ${safeReason}</p>`
      : '';
    const bodyHtml = [
      `<p style="margin:0 0 12px 0;color:#A8A8AA;font-size:16px;line-height:1.6;">${t.body}</p>`,
      reasonBlock,
      `<p style="margin:16px 0 0 0;"><a href="${confirmUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}" style="display:inline-block;background:#6E7A8A;color:#F2F2F2;text-decoration:none;font-size:16px;font-weight:600;padding:14px 24px;border-radius:12px;">${t.buttonLabel}</a></p>`,
    ].join('');
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || undefined;
    const html = buildEmailHtml({
      title: t.title,
      bodyHtml,
      footerText: t.ignore,
      baseUrl,
      companyName:
        this.configService.get<string>('EMAIL_COMPANY_NAME') || 'Citewalk',
      companyAddress:
        this.configService.get<string>('EMAIL_COMPANY_ADDRESS') || undefined,
      unsubscribeUrl:
        this.configService.get<string>('EMAIL_PREFERENCES_URL') || undefined,
      reasonText:
        'You received this because you requested to delete your Citewalk account.',
    });
    const text = [t.title, t.body, t.buttonLabel, confirmUrl, t.ignore].join(
      '\n\n',
    );

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Citewalk" <noreply@citewalk.com>',
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Account deletion confirmation sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send account deletion confirmation to ${to}:`,
        error,
      );
      throw error;
    }
  }

  async sendDataExportLink(
    to: string,
    downloadUrl: string,
    lang: string = 'en',
  ): Promise<boolean> {
    const t = dataExportTemplates[lang] || dataExportTemplates['en'];
    const subject = t.subject;

    if (!this.transporter) {
      this.logger.warn(
        `[DEV] Email suppressed (SMTP not configured). To: ${to}, Download URL: ${downloadUrl}`,
      );
      return false;
    }

    const safeUrl = downloadUrl
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const bodyHtml = [
      `<p style="margin:0 0 12px 0;color:#A8A8AA;font-size:16px;line-height:1.6;">${t.body}</p>`,
      `<p style="margin:16px 0 0 0;"><a href="${safeUrl}" style="display:inline-block;background:#6E7A8A;color:#F2F2F2;text-decoration:none;font-size:16px;font-weight:600;padding:14px 24px;border-radius:12px;">${t.buttonLabel}</a></p>`,
    ].join('');
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || undefined;
    const html = buildEmailHtml({
      title: t.title,
      bodyHtml,
      footerText: t.ignore,
      baseUrl,
      companyName:
        this.configService.get<string>('EMAIL_COMPANY_NAME') || 'Citewalk',
      companyAddress:
        this.configService.get<string>('EMAIL_COMPANY_ADDRESS') || undefined,
      unsubscribeUrl:
        this.configService.get<string>('EMAIL_PREFERENCES_URL') || undefined,
      reasonText:
        'You received this because you requested a copy of your Citewalk data.',
    });
    const text = [t.title, t.body, t.buttonLabel, downloadUrl, t.ignore].join(
      '\n\n',
    );

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Citewalk" <noreply@citewalk.com>',
        to,
        subject,
        html,
        text,
      });
      this.logger.log(`Data export link sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send data export link to ${to}:`, error);
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
      this.logger.warn(
        `[DEV] Email suppressed (SMTP not configured). To: ${to} | Subject: ${subject}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from:
          this.configService.get<string>('SMTP_FROM') ||
          '"Citewalk System" <noreply@citewalk.com>',
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
