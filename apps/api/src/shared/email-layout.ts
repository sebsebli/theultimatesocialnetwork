/**
 * Shared email layout aligned with Citewalk System design (Brutalist/Technical).
 * Theme: Ink (#0B0B0C) / Paper (#F2F2F2) / Steel (#6E7A8A).
 * Typography: System Sans (Inter/SF Pro) + Monospace for data.
 */

export interface EmailLayoutOptions {
  title: string;
  bodyHtml: string;
  code?: string;
  footerText: string;
  baseUrl?: string;
  companyName?: string;
  companyAddress?: string;
  unsubscribeUrl?: string;
  reasonText?: string;
  logoUrl?: string;
  helpEmail?: string;
}

// Citewalk System Palette
const C = {
  INK: '#0B0B0C',
  PAPER: '#F2F2F2',
  STEEL: '#6E7A8A',
  MUTED: '#A8A8AA',
  SUBTLE: '#1A1A1D',
  BORDER: '#333333',
  CODE_BG: '#121215',
};

// Typography Stacks
const FONT_SANS = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`;
const FONT_MONO = `font-family: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace;`;

const STYLES = {
  // Reset & Base
  wrapper: `margin:0;padding:0;width:100%;background-color:${C.INK};color:${C.PAPER};-webkit-text-size-adjust:100%;`,
  outerTable: `width:100%;border-collapse:collapse;background-color:${C.INK};`,

  // Container
  innerCell: `max-width:600px;width:100%;padding:40px 20px;background-color:${C.INK};`,

  // Header
  header: `padding:0 0 32px 0;border-bottom:1px solid ${C.SUBTLE};margin-bottom:32px;`,
  logo: `display:block;width:32px;height:32px;border-radius:6px;`,
  systemBadge: `display:inline-block;padding:4px 8px;background:${C.SUBTLE};border:1px solid ${C.BORDER};border-radius:4px;color:${C.STEEL};font-size:10px;text-transform:uppercase;letter-spacing:1px;${FONT_MONO}`,

  // Content
  card: `background-color:${C.INK};padding:0;`, // No card background for brutalist feel, just clean text on ink
  title: `color:${C.PAPER};font-size:24px;font-weight:600;line-height:1.2;margin:0 0 24px 0;letter-spacing:-0.5px;${FONT_SANS}`,
  body: `color:${C.MUTED};font-size:16px;line-height:1.6;margin:0 0 24px 0;${FONT_SANS}`,

  // Code Block (Technical look)
  codeContainer: `margin:32px 0;text-align:center;`,
  codeBox: `display:inline-block;background:${C.CODE_BG};color:${C.PAPER};font-size:28px;font-weight:700;letter-spacing:6px;padding:24px 32px;border:1px solid ${C.STEEL};border-radius:0;${FONT_MONO}`,
  codeLabel: `display:block;margin-top:12px;color:${C.STEEL};font-size:11px;text-transform:uppercase;letter-spacing:1px;${FONT_MONO}`,

  // Footer
  footer: `border-top:1px solid ${C.SUBTLE};padding-top:32px;margin-top:48px;`,
  footerText: `color:${C.STEEL};font-size:12px;line-height:1.5;margin-bottom:16px;${FONT_MONO}`,
  legalLink: `color:${C.MUTED};text-decoration:none;border-bottom:1px solid ${C.SUBTLE};`,
};

const RESPONSIVE_STYLES = `
  body { background-color: #0B0B0C !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
  .email-wrapper { width: 100% !important; background-color: #0B0B0C !important; }
  .inner-cell { background-color: #0B0B0C !important; }
  .code-box { font-size: 24px !important; padding: 20px !important; letter-spacing: 4px !important; }
  @media only screen and (max-width: 480px) {
    .inner-cell { padding: 30px 16px !important; }
    .title { font-size: 20px !important; }
    .code-box { font-size: 20px !important; letter-spacing: 2px !important; padding: 16px !important; width: 100% !important; box-sizing: border-box !important; }
  }
`;

function buildLegalFooter(opts: {
  baseUrl?: string;
  companyName: string;
  companyAddress?: string;
  unsubscribeUrl?: string;
  reasonText?: string;
  helpEmail?: string;
}): string {
  const { baseUrl, companyName, unsubscribeUrl, reasonText, helpEmail } = opts;
  const url = baseUrl ? baseUrl.replace(/\/$/, '') : '#';

  const links = [
    `<a href="${url}" style="${STYLES.legalLink}">Index</a>`,
    `<a href="${url}/manifesto" style="${STYLES.legalLink}">Manifesto</a>`,
    `<a href="${url}/privacy" style="${STYLES.legalLink}">Privacy</a>`,
  ];

  if (unsubscribeUrl) {
    links.push(
      `<a href="${unsubscribeUrl}" style="${STYLES.legalLink}">Config</a>`,
    );
  }

  let html = `<p style="${STYLES.footerText}">SYSTEM: ACTIVE<br>&copy; ${new Date().getFullYear()} ${escapeHtml(companyName)}</p>`;

  if (reasonText) {
    html += `<p style="${STYLES.footerText}color:${C.MUTED};">${escapeHtml(reasonText)}</p>`;
  }

  html += `<p style="${STYLES.footerText}">${links.join(' &nbsp; / &nbsp; ')}</p>`;

  if (helpEmail) {
    html += `<p style="${STYLES.footerText}">SIGNAL: <a href="mailto:${helpEmail}" style="${STYLES.legalLink}">${helpEmail}</a></p>`;
  }

  return html;
}

export function buildEmailHtml(options: EmailLayoutOptions): string {
  const {
    title,
    bodyHtml,
    code,
    footerText,
    baseUrl,
    companyName = 'Citewalk',
    companyAddress,
    unsubscribeUrl,
    reasonText,
    logoUrl,
    helpEmail,
  } = options;

  const codeBlock = code
    ? `<div style="${STYLES.codeContainer}">
         <span class="code-box" style="${STYLES.codeBox}">${escapeHtml(code)}</span>
       </div>`
    : '';

  const footerContent = buildLegalFooter({
    baseUrl,
    companyName,
    companyAddress,
    unsubscribeUrl,
    reasonText,
    helpEmail,
  });

  // Header: Logo + System Badge
  const headerContent = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="left">
          ${logoUrl ? `<img src="${logoUrl}" width="32" height="32" style="${STYLES.logo}" alt="Citewalk" />` : `<span style="font-weight:bold;color:${C.PAPER};">Citewalk</span>`}
        </td>
        <td align="right">
          <span style="${STYLES.systemBadge}">System Msg</span>
        </td>
      </tr>
    </table>
  `;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">${RESPONSIVE_STYLES}</style>
</head>
<body style="${STYLES.wrapper}" bgcolor="#0B0B0C">
  <center>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="email-wrapper" bgcolor="#0B0B0C">
      <tr>
        <td align="center" valign="top" bgcolor="#0B0B0C">
          <!-- Main Container -->
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:#0B0B0C;" bgcolor="#0B0B0C">
            <tr>
              <td class="inner-cell" style="${STYLES.innerCell}" bgcolor="#0B0B0C">
                
                <!-- Header -->
                <div style="${STYLES.header}">
                  ${headerContent}
                </div>

                <!-- Body -->
                <div style="${STYLES.card}">
                  <h1 class="title" style="${STYLES.title}">${escapeHtml(title)}</h1>
                  <div class="body" style="${STYLES.body}">${bodyHtml}</div>
                  
                  ${codeBlock}
                  
                  <p style="${STYLES.body};font-size:14px;color:${C.STEEL};border-left:1px solid ${C.STEEL};padding-left:16px;margin-top:32px;">
                    ${escapeHtml(footerText)}
                  </p>
                </div>

                <!-- Footer -->
                <div style="${STYLES.footer}">
                  ${footerContent}
                </div>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`.trim();
}

function escapeHtml(s: string): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
