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

/** Escape string for safe use in HTML attributes (XSS prevention). */
function escapeAttr(s: string): string {
  if (!s || typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape string for safe use as HTML text content. */
function escapeText(s: string): string {
  if (!s || typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const CODE_BLOCK_PLACEHOLDER = "\u200B__CODE_BLOCK_";
const CODE_BLOCK_PLACEHOLDER_END = "__\u200B";

/**
 * Produce a single-line plain-text excerpt for post previews.
 * Strips markdown, replaces newlines with space, truncates at maxLength.
 * @param ellipsis - when true (default), appends "..." when truncated; when false, returns raw truncation for use with gradient fade.
 */
export function bodyToPlainExcerpt(
  body: string,
  title?: string | null,
  maxLength = 120,
  ellipsis = true,
): string {
  if (!body?.trim()) return "";
  let text = stripLeadingH1IfMatch(body, title ?? undefined);
  // Wikilinks: [[target|alias]] -> alias or target; [[target]] -> target
  text = text.replace(/\[\[([^\]]+)\]\]/g, (_, content) => {
    const pipe = content.indexOf("|");
    if (pipe !== -1)
      return content.slice(pipe + 1).trim() || content.slice(0, pipe).trim();
    return content.trim();
  });
  // Markdown links: [text](url) or [url](text) -> use display text (non-URL part)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, a, b) =>
    (/^https?:\/\//i.test(b) ? a : /^https?:\/\//i.test(a) ? b : a).trim(),
  );
  // Bold, italic, inline code: keep text only
  text = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
  // Headers: strip # ## ###
  text = text.replace(/^#{1,6}\s+/gm, "");
  // Blockquote/list markers
  text = text
    .replace(/^>\s*/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "");
  // Newlines and multiple spaces -> single space
  text = text.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + (ellipsis ? "..." : "");
}

/**
 * Strip the first line of body if it is exactly "# &lt;title&gt;" (so the title is not shown twice in full post view).
 */
export function stripLeadingH1IfMatch(
  body: string,
  title: string | null | undefined,
): string {
  if (!title || !body.trim()) return body;
  const firstLine = body.split("\n")[0].trim();
  if (firstLine === "# " + title || firstLine === "#" + title) {
    const rest = body.slice(body.indexOf("\n") + 1);
    return rest.trimStart();
  }
  return body;
}

/** Optional metadata for resolving post link labels when no alias is provided (e.g. post title by id). deletedAt means show "(deleted content)". */
export interface RenderMarkdownOptions {
  referenceMetadata?: Record<
    string,
    { title?: string; deletedAt?: string; isProtected?: boolean }
  >;
}

/**
 * Render markdown supported by the composer, including inline and fenced code.
 * Supported: H1/H2/H3, bold **, italic _, inline code `, fenced code ```...```, [[wikilink]], [link](url).
 * For [[post:id]] with no alias, display text is referenceMetadata[id].title or first 8 chars of id.
 */
export function renderMarkdown(
  text: string,
  options?: RenderMarkdownOptions,
): string {
  const referenceMetadata = options?.referenceMetadata;
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

  // No line breaks before/after [[]], [text](url): collapse to space so they render inline as in source
  html = html.replace(/\n+\s*(\[\[[^\]]+\]\])/g, " $1");
  html = html.replace(/(\[\[[^\]]+\]\])\s*\n+\s*/g, "$1 ");
  html = html.replace(/\n+\s*(\[[^\]]+\]\([^)]+\))/g, " $1");
  html = html.replace(/(\[[^\]]+\]\([^)]+\))\s*\n+\s*/g, "$1 ");

  // Headers: only exactly # , ## , ### (composer supports H1/H2/H3 only) – Inter, H1 > H2 > H3, tight spacing
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="prose-heading prose-h3 text-base font-semibold mt-2 mb-1">$1</h3>',
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="prose-heading prose-h2 text-lg font-semibold mt-2 mb-1">$1</h2>',
  );
  html = html.replace(
    /^# ([^#].*)$/gm,
    '<h1 class="prose-heading prose-h1 text-xl font-bold mt-2 mb-1">$1</h1>',
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
    // for opening the "Targets Sheet". Inline, same style as body text (no linebreak).
    if (targetItems.length > 1) {
      const safeTargets = targetItems.map(escapeAttr).join(",");
      const safeAlias = escapeAttr(alias || "Linked Items");
      const display = escapeText(alias || targetItems[0] + "...");
      return `<span class="prose-tag inline hover:underline cursor-pointer" data-targets="${safeTargets}" data-alias="${safeAlias}">${display}</span>`;
    }

    const target = parseWikilink(content);
    if (!target) return match;

    const explicitAlias = parts[1]?.trim();
    if (target.type === "post") {
      const safeId = target.target.replace(/[^a-zA-Z0-9-]/g, "");
      const id = target.target;
      const refMeta =
        referenceMetadata?.[id] ??
        referenceMetadata?.[id?.toLowerCase?.() ?? ""];
      const refTitle = refMeta?.title;
      const isDeleted = !!refMeta?.deletedAt;
      const isProtected = !!refMeta?.isProtected;

      let suffix = "";
      if (isDeleted) suffix = " (deleted)";
      else if (isProtected) suffix = " (private)";

      // If user provided an alias, use it. Otherwise use title or ID.
      // Append status suffix (deleted/private) unless explicitly aliased?
      // Requirement: "contain the title at least and a link that this post has been deleted"
      // So even if aliased, we might want to know it's deleted?
      // Standard practice: if I aliased it, I take responsibility.
      // But if no alias (citation), show title + suffix.

      const baseText = explicitAlias || refTitle || target.target.slice(0, 8);
      // For deleted/private, if no explicit alias, show title + suffix.
      // If explicit alias, just show alias?
      // User said: "Referenced posts ... should contain the title at least and a link that this post has been deleted".
      // This usually implies automatic citations.

      const displayText = isDeleted
        ? refTitle
          ? `${refTitle} (deleted)`
          : `(deleted content)`
        : baseText + (isProtected && !explicitAlias ? suffix : "");

      const safeDisplay = escapeText(displayText);
      // Add visual cue class if deleted/private
      const classes =
        isDeleted || isProtected
          ? "prose-tag inline hover:underline opacity-70"
          : "prose-tag inline hover:underline";

      return `<a href="/post/${safeId}" class="${classes}">${safeDisplay}</a>`;
    }

    const safeAlias = escapeText(target.alias ?? "");
    if (target.type === "topic") {
      const slugEnc = encodeURIComponent(target.target);
      return `<a href="/topic/${slugEnc}" class="prose-tag inline hover:underline">${safeAlias}</a>`;
    } else {
      const safeUrl = sanitizeUrl(target.target);
      return `<a href="${safeUrl}" class="prose-tag inline hover:underline" target="_blank" rel="noopener noreferrer">${safeAlias}</a>`;
    }
  });

  // Markdown links: [text](url) or [url](text) (Cite format) – external URL style: orange, no underline (parity with mobile)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, a, b) => {
    const isUrl = (s: string) => /^https?:\/\//i.test(s);
    const href = isUrl(b) ? b : isUrl(a) ? a : b;
    const display = isUrl(b) ? a : isUrl(a) ? b : a;
    const safeUrl = sanitizeUrl(href);
    const safeText = escapeText(display);
    return `<a href="${safeUrl}" class="prose-tag prose-link-external inline" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  });

  // Bold
  html = html.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-paper">$1</strong>',
  );

  // Italic
  html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  // Inline code (styled by .prose code in globals.css)
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Strip leading whitespace on each line so wrapped/continuation lines don't get weird padding
  html = html
    .split("\n")
    .map((line) => line.trimStart())
    .join("\n");
  // Line breaks
  html = html.replace(/\n/g, "<br />");

  // Restore fenced code blocks (styled by .prose pre / .prose pre code in globals.css – paragraph spacing, lighter grey bg, orange code)
  codeBlocks.forEach((content, idx) => {
    const placeholder =
      CODE_BLOCK_PLACEHOLDER + idx + CODE_BLOCK_PLACEHOLDER_END;
    const blockHtml = "<pre><code>" + content + "</code></pre>";
    html = html.replace(placeholder, blockHtml);
  });

  return html;
}
