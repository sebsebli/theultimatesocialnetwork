/**
 * Shared email layout aligned with Cite app design (dark theme, responsive, mobile-first).
 * Colors: background #0B0B0C, foreground #F2F2F2, accent #6E7A8A, secondary #A8A8AA, divider #1A1A1D.
 * Table-based layout for maximum client support; color-scheme meta for dark-aware clients.
 */

export interface EmailLayoutOptions {
  title: string;
  bodyHtml: string;
  code?: string;
  footerText: string;
  /** Base URL for legal links (e.g. FRONTEND_URL). Used for website, /privacy, /terms */
  baseUrl?: string;
  /** Company/sender name for legal footer (default: Cite) */
  companyName?: string;
  /** Physical address for CAN-SPAM / legal (optional) */
  companyAddress?: string;
}

const BG_DARK = '#0B0B0C';
const CARD_BG = '#1A1A1D';
const BORDER = '#2A2A2E';
const DIVIDER = '#1A1A1D';
const FG = '#F2F2F2';
const MUTED = '#A8A8AA';
const LEGAL = '#6E6E73';
const LINK = '#6E7A8A';

const STYLES = {
  wrapper: `margin:0;padding:0;width:100%;background-color:${BG_DARK};-webkit-text-size-adjust:100%;`,
  outerTable: `width:100%;border-collapse:collapse;background-color:${BG_DARK};`,
  innerCell: `max-width:600px;width:100%;padding:20px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;`,
  header: `padding:24px 0;border-bottom:1px solid ${DIVIDER};`,
  logo: `color:${FG};font-size:22px;font-weight:600;letter-spacing:-0.5px;margin:0;`,
  card: `background-color:${CARD_BG};border-radius:12px;padding:24px 20px;margin:24px 0;border:1px solid ${BORDER};`,
  title: `color:${FG};font-size:20px;font-weight:600;line-height:1.3;margin:0 0 12px 0;`,
  body: `color:${MUTED};font-size:16px;line-height:1.6;margin:0 0 20px 0;`,
  codeBox: `display:inline-block;background:${BG_DARK};color:${FG};font-family:ui-monospace,monospace;font-size:28px;font-weight:700;letter-spacing:6px;padding:16px 24px;border-radius:8px;margin:16px 0;border:1px solid ${BORDER};`,
  footer: `color:${LEGAL};font-size:13px;line-height:1.5;margin-top:24px;padding-top:20px;border-top:1px solid ${DIVIDER};`,
  legal: `color:${LEGAL};font-size:11px;line-height:1.6;margin-top:32px;padding-top:20px;border-top:1px solid ${DIVIDER};`,
  legalLink: `color:${LINK};text-decoration:underline;`,
};

const RESPONSIVE_STYLES = `
  :root { color-scheme: dark; supported-color-schemes: dark; }
  @media only screen and (max-width: 600px) {
    .email-inner { padding: 16px 12px !important; }
    .email-card { padding: 20px 16px !important; margin: 16px 0 !important; }
    .email-title { font-size: 18px !important; }
    .email-body, .email-body p { font-size: 15px !important; line-height: 1.5 !important; }
    .email-code-box { font-size: 24px !important; letter-spacing: 4px !important; padding: 14px 20px !important; }
    .email-footer { font-size: 12px !important; margin-top: 16px !important; padding-top: 16px !important; }
    .email-legal { font-size: 11px !important; margin-top: 24px !important; padding-top: 16px !important; }
  }
  @media only screen and (max-width: 480px) {
    .email-inner { padding: 12px 10px !important; }
    .email-card { padding: 16px 12px !important; }
    .email-code-box { font-size: 20px !important; letter-spacing: 3px !important; padding: 12px 16px !important; }
  }
`;

function buildLegalFooter(opts: {
  baseUrl?: string;
  companyName: string;
  companyAddress?: string;
}): string {
  const { baseUrl, companyName, companyAddress } = opts;
  const links: string[] = [];
  if (baseUrl) {
    const url = baseUrl.replace(/\/$/, '');
    links.push(
      `<a href="${escapeAttr(url)}" style="${STYLES.legalLink}">${escapeHtml('Website')}</a>`,
    );
    links.push(
      `<a href="${escapeAttr(url + '/privacy')}" style="${STYLES.legalLink}">${escapeHtml('Privacy')}</a>`,
    );
    links.push(
      `<a href="${escapeAttr(url + '/terms')}" style="${STYLES.legalLink}">${escapeHtml('Terms')}</a>`,
    );
  }
  const line1 = `&copy; ${new Date().getFullYear()} ${escapeHtml(companyName)}.`;
  const line2 = companyAddress ? escapeHtml(companyAddress) : null;
  const line3 = links.length ? links.join(' &nbsp;|&nbsp; ') : null;
  const parts = [line1];
  if (line2) parts.push(line2);
  if (line3) parts.push(line3);
  return parts.join('<br>');
}

export function buildEmailHtml(options: EmailLayoutOptions): string {
  const {
    title,
    bodyHtml,
    code,
    footerText,
    baseUrl,
    companyName = 'Cite',
    companyAddress,
  } = options;

  const codeBlock = code
    ? `<div style="text-align:center;"><span class="email-code-box" style="${STYLES.codeBox}">${escapeHtml(code)}</span></div>`
    : '';

  const legalHtml = buildLegalFooter({ baseUrl, companyName, companyAddress });

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">${RESPONSIVE_STYLES}</style>
</head>
<body style="${STYLES.wrapper}" bgcolor="${BG_DARK}">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${STYLES.outerTable}" bgcolor="${BG_DARK}">
    <tr><td align="center" style="padding:0;background-color:${BG_DARK};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;margin:0 auto;border-collapse:collapse;background-color:${BG_DARK};">
    <tr><td class="email-inner" style="${STYLES.innerCell};background-color:${BG_DARK};">
    <div style="${STYLES.header}">
      <p style="${STYLES.logo}">${escapeHtml(companyName)}</p>
    </div>
    <div class="email-card" style="${STYLES.card}">
      <h1 class="email-title" style="${STYLES.title}">${escapeHtml(title)}</h1>
      <div class="email-body" style="${STYLES.body}">${bodyHtml}</div>
      ${codeBlock}
      <p class="email-footer" style="${STYLES.footer}">${escapeHtml(footerText)}</p>
    </div>
    <p class="email-legal" style="${STYLES.legal}">${legalHtml}</p>
    </td></tr>
  </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
