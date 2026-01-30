/**
 * Markdown and Wikilink rendering utilities
 */

export interface LinkTarget {
  type: "topic" | "post" | "url";
  target: string;
  alias?: string;
}

/**
 * Parse wikilink syntax: [[target|alias]] or [[target]]
 */
export function parseWikilink(content: string): LinkTarget | null {
  const parts = content.split("|");
  const targetRaw = parts[0].trim();
  const alias = parts[1]?.trim();

  if (targetRaw.toLowerCase().startsWith("post:")) {
    const postId = targetRaw.split(":")[1];
    return {
      type: "post",
      target: postId,
      alias: alias || targetRaw,
    };
  } else if (
    targetRaw.startsWith("http://") ||
    targetRaw.startsWith("https://")
  ) {
    return {
      type: "url",
      target: targetRaw,
      alias: alias || targetRaw,
    };
  } else {
    return {
      type: "topic",
      target: targetRaw,
      alias: alias || targetRaw,
    };
  }
}

/**
 * Extract all wikilinks from text
 */
export function extractWikilinks(
  text: string,
): Array<{ match: string; target: LinkTarget }> {
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
    const protocol = new URL(url, "http://localhost").protocol;
    if (protocol === "http:" || protocol === "https:") {
      return url;
    }
    return "";
  } catch {
    return "";
  }
}

const CODE_BLOCK_PLACEHOLDER = "\u200B__CODE_BLOCK_";
const CODE_BLOCK_PLACEHOLDER_END = "__\u200B";

/**
 * Render markdown supported by the composer, including inline and fenced code.
 * Supported: H1/H2/H3, bold **, italic _, inline code `, fenced code ```...```, [[wikilink]], [link](url).
 */
export function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Extract fenced code blocks first so other markdown doesn't touch them
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, _lang, content) => {
    const idx = codeBlocks.length;
    codeBlocks.push(content.trimEnd());
    return CODE_BLOCK_PLACEHOLDER + idx + CODE_BLOCK_PLACEHOLDER_END;
  });

  // Headers: only exactly # , ## , ### (composer supports H1/H2/H3 only)
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>',
  );
  html = html.replace(
    /^# ([^#].*)$/gm,
    '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>',
  );

  // Blockquote and list (composer-supported)
  html = html.replace(
    /^> (.+)$/gm,
    '<blockquote class="border-l-2 border-primary/60 pl-4 my-2 text-secondary italic">$1</blockquote>',
  );
  html = html.replace(/^- (.+)$/gm, '<div class="my-0.5">• $1</div>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div class="my-0.5">$1. $2</div>');

  // Wikilinks
  html = html.replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
    const parts = content.split("|");
    const targetsRaw = parts[0];
    const alias = parts[1]?.trim();

    const targetItems = targetsRaw.split(",").map((s: string) => s.trim());

    // If multi-target, we return a special span that the client can hook into
    // for opening the "Targets Sheet" as per spec.
    if (targetItems.length > 1) {
      return `<span class="text-primary hover:underline font-medium cursor-pointer" data-targets="${targetItems.join(",")}" data-alias="${alias || "Linked Items"}">${alias || targetItems[0] + "..."}</span>`;
    }

    const target = parseWikilink(content);
    if (!target) return match;

    if (target.type === "post") {
      return `<a href="/post/${target.target}" class="text-primary hover:underline font-medium">${target.alias}</a>`;
    } else if (target.type === "topic") {
      // Use exact wikilink target as topic ID (no slugification)
      const slugEnc = encodeURIComponent(target.target);
      return `<a href="/topic/${slugEnc}" class="text-primary hover:underline font-medium">${target.alias}</a>`;
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
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-paper">$1</strong>',
  );

  // Italic
  html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="px-1 py-0.5 rounded bg-white/10 font-mono text-sm">$1</code>',
  );

  // Line breaks
  html = html.replace(/\n/g, "<br />");

  // Restore fenced code blocks
  codeBlocks.forEach((content, idx) => {
    const placeholder =
      CODE_BLOCK_PLACEHOLDER + idx + CODE_BLOCK_PLACEHOLDER_END;
    const blockHtml =
      '<pre class="my-4 p-4 rounded-lg bg-black/35 border border-white/10 overflow-x-auto text-sm"><code>' +
      content +
      "</code></pre>";
    html = html.replace(placeholder, blockHtml);
  });

  return html;
}
