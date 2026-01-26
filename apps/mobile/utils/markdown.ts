// Markdown and wikilink renderer for mobile
// Similar to web version but adapted for React Native

export interface LinkTarget {
  type: 'topic' | 'post' | 'url';
  id?: string;
  slug?: string;
  title?: string;
  url?: string;
}

export function parseWikilinks(text: string): Array<{
  type: 'wikilink' | 'mention' | 'url' | 'text';
  content: string;
  targets?: LinkTarget[];
  url?: string;
  handle?: string;
}> {
  const parts: Array<{
    type: 'wikilink' | 'mention' | 'url' | 'text';
    content: string;
    targets?: LinkTarget[];
    url?: string;
    handle?: string;
  }> = [];

  let lastIndex = 0;
  let index = 0;

  // Match wikilinks [[...]]
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = wikilinkRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      const before = text.substring(lastIndex, match.index);
      parseTextSegment(before, parts);
    }

    const content = match[1];
    const targets: LinkTarget[] = [];

    // Parse multi-target: [[target1, target2|alias]]
    if (content.includes('|')) {
      const [targetsStr, alias] = content.split('|');
      const targetList = targetsStr.split(',').map(t => t.trim());

      for (const target of targetList) {
        if (target.startsWith('post:')) {
          targets.push({
            type: 'post',
            id: target.replace('post:', ''),
            title: alias || undefined,
          });
        } else {
          targets.push({
            type: 'topic',
            slug: target.toLowerCase().replace(/\s+/g, '-'),
            title: alias || target,
          });
        }
      }
    } else if (content.startsWith('post:')) {
      targets.push({
        type: 'post',
        id: content.replace('post:', ''),
      });
    } else {
      targets.push({
        type: 'topic',
        slug: content.toLowerCase().replace(/\s+/g, '-'),
        title: content,
      });
    }

    parts.push({
      type: 'wikilink',
      content: match[0],
      targets,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parseTextSegment(text.substring(lastIndex), parts);
  }

  return parts;
}

function parseTextSegment(text: string, parts: Array<any>) {
  // Match mentions @handle
  const mentionRegex = /@(\w+)/g;
  let mentionMatch;
  let lastMentionIndex = 0;

  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    if (mentionMatch.index > lastMentionIndex) {
      const before = text.substring(lastMentionIndex, mentionMatch.index);
      parseUrls(before, parts);
    }

    parts.push({
      type: 'mention',
      content: mentionMatch[0],
      handle: mentionMatch[1],
    });

    lastMentionIndex = mentionMatch.index + mentionMatch[0].length;
  }

  if (lastMentionIndex < text.length) {
    parseUrls(text.substring(lastMentionIndex), parts);
  }
}

function parseUrls(text: string, parts: Array<any>) {
  // Match markdown links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let linkMatch;
  let lastLinkIndex = 0;

  while ((linkMatch = markdownLinkRegex.exec(text)) !== null) {
    if (linkMatch.index > lastLinkIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastLinkIndex, linkMatch.index),
      });
    }

    parts.push({
      type: 'url',
      content: linkMatch[1],
      url: linkMatch[2],
    });

    lastLinkIndex = linkMatch.index + linkMatch[0].length;
  }

  // Match bare URLs (not part of a markdown link)
  const urlRegex = /(?<!\]\()(https?:\/\/[^\s<]+)/g;
  let urlMatch;
  let lastUrlIndex = lastLinkIndex;

  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const actualIndex = urlMatch.index;
    if (actualIndex < lastLinkIndex) continue; // Skip if already processed by markdown link regex
    
    if (actualIndex > lastUrlIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastUrlIndex, actualIndex),
      });
    }

    parts.push({
      type: 'url',
      content: urlMatch[1],
      url: urlMatch[1],
    });

    lastUrlIndex = actualIndex + urlMatch[0].length;
  }

  if (lastUrlIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastUrlIndex),
    });
  } else if (lastLinkIndex === 0 && !urlMatch) {
    // No links found, add as text
    parts.push({
      type: 'text',
      content: text,
    });
  }
}
