/**
 * Markdown and Wikilink rendering utilities
 */

export interface LinkTarget {
  type: 'topic' | 'post' | 'url';
  target: string;
  alias?: string;
}

/**
 * Parse wikilink syntax: [[target|alias]] or [[target]]
 */
export function parseWikilink(content: string): LinkTarget | null {
  const parts = content.split('|');
  const targetRaw = parts[0].trim();
  const alias = parts[1]?.trim();

  if (targetRaw.toLowerCase().startsWith('post:')) {
    const postId = targetRaw.split(':')[1];
    return {
      type: 'post',
      target: postId,
      alias: alias || targetRaw,
    };
  } else if (targetRaw.startsWith('http://') || targetRaw.startsWith('https://')) {
    return {
      type: 'url',
      target: targetRaw,
      alias: alias || targetRaw,
    };
  } else {
    return {
      type: 'topic',
      target: targetRaw,
      alias: alias || targetRaw,
    };
  }
}

/**
 * Extract all wikilinks from text
 */
export function extractWikilinks(text: string): Array<{ match: string; target: LinkTarget }> {
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  const links: Array<{ match: string; target: LinkTarget }> = [];
  let match;

  while ((match = wikilinkRegex.exec(text)) !== null) {
    const target = parseWikilink(match[1]);
    if (target) {
      links.push({ match: match[0], target });
    }
  }

  return links;
}

function sanitizeUrl(url: string): string {
  try {
    const protocol = new URL(url, 'http://localhost').protocol;
    if (protocol === 'http:' || protocol === 'https:') {
      return url;
    }
    return '';
  } catch (e) {
    return '';
  }
}

/**
 * Render markdown to HTML (basic implementation)
 */
export function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

  // Wikilinks
  html = html.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
    const target = parseWikilink(content);
    if (!target) return match;

    if (target.type === 'post') {
      return `<a href="/post/${target.target}" class="text-primary hover:underline font-medium">${target.alias}</a>`;
    } else if (target.type === 'topic') {
      const slug = target.target.toLowerCase().replace(/\s+/g, '-');
      return `<a href="/topic/${slug}" class="text-primary hover:underline font-medium">${target.alias}</a>`;
    } else {
      const safeUrl = sanitizeUrl(target.target);
      return `<a href="${safeUrl}" class="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">${target.alias}</a>`;
    }
  });

  // Markdown links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    const safeUrl = sanitizeUrl(url);
    return `<a href="${safeUrl}" class="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-paper">$1</strong>');

  // Italic
  html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
}
