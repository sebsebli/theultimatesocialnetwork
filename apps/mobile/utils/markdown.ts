/**
 * Markdown and Wikilink rendering utilities (Mobile Port)
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