export const BODY_MAX_LENGTH = 10000;
export const BODY_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 40;
export const MAX_TOPIC_REFS = 15;
/** Max total sources: post refs, topic refs, and markdown links (parity with mobile). */
export const MAX_SOURCES = 16;

/**
 * Count sources in body: [[post:id]], [[Topic]], [text](url). Matches API/mobile parsing.
 */
export function countSources(body: string): number {
  const seen = new Set<string>();
  // [[post:uuid]]
  const postRe = /\[\[post:([a-f0-9\-]+)\]\]/gi;
  let m: RegExpExecArray | null;
  while ((m = postRe.exec(body)) !== null) {
    seen.add(`post:${m[1].toLowerCase()}`);
  }
  // [[Topic]] or [[topic|alias]] (topic refs, not post)
  const topicRe = /\[\[(?!post:)([^\]]+)\]\]/g;
  while ((m = topicRe.exec(body)) !== null) {
    const slug = m[1].split("|")[0].trim().toLowerCase();
    if (slug) seen.add(`topic:${slug}`);
  }
  // [text](http...)
  const linkRe = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  while ((m = linkRe.exec(body)) !== null) {
    seen.add(m[2]);
  }
  return seen.size;
}

/** Ranges that must not receive headings, bold or italic: wikilinks [[...]] and markdown links [text](url). */
export const getProtectedRanges = (
  text: string,
): { start: number; end: number }[] => {
  const ranges: { start: number; end: number }[] = [];
  // Wikilinks: [[...]] (articles, topic tags)
  const wikiRe = /[[^]]*]]/g;
  let m: RegExpExecArray | null;
  while ((m = wikiRe.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  // Markdown links: [text](url) (sources)
  const linkRe = /[[^]]*]\[[^)]*\]/g;
  while ((m = linkRe.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  return ranges;
};

export const selectionOverlapsProtected = (
  sel: { start: number; end: number },
  ranges: { start: number; end: number }[],
): boolean => {
  return ranges.some((r) => sel.start < r.end && sel.end > r.start);
};

/** Enforce max length for headline lines (H1/H2/H3) and for wikilink/link aliases. Stops new letters when limits are hit. */
export const enforceTitleAndAliasLimits = (
  text: string,
  maxLen: number,
): string => {
  let out =
    text.length <= BODY_MAX_LENGTH ? text : text.slice(0, BODY_MAX_LENGTH);
  const lines = out.split("\n");
  const trimmed: string[] = [];
  for (const line of lines) {
    if (line.startsWith("### ")) {
      trimmed.push("### " + line.slice(4).slice(0, maxLen));
    } else if (line.startsWith("## ")) {
      trimmed.push("## " + line.slice(3).slice(0, maxLen));
    } else if (line.startsWith("# ")) {
      trimmed.push("# " + line.slice(2).slice(0, maxLen));
    } else {
      trimmed.push(line);
    }
  }
  out = trimmed.join("\n");
  // Wikilinks: [[x|alias]] or [[x]] – truncate alias or single part to maxLen
  out = out.replace(/[[^]]*\]/g, (match, content) => {
    const pipeIdx = content.indexOf("|");
    if (pipeIdx >= 0) {
      const before = content.slice(0, pipeIdx);
      const alias = content.slice(pipeIdx + 1).slice(0, maxLen);
      return `[[${before}|${alias}]]`;
    }
    return `[[${content.slice(0, maxLen)}]]`;
  });
  // Markdown links: [text](url) – truncate text to maxLen
  out = out.replace(
    /[[^]]*]\[[^)]*\]/g,
    (_, linkText, url) => `[${linkText.slice(0, maxLen)}](${url})`,
  );
  return out;
};

export const hasOverlongHeading = (text: string): boolean => {
  const lines = text.split("\n");
  for (const line of lines) {
    let content = "";
    if (line.startsWith("### ")) content = line.slice(4).trim();
    else if (line.startsWith("## ")) content = line.slice(3).trim();
    else if (line.startsWith("# ")) content = line.slice(2).trim();
    if (content.length > 0 && content.length > TITLE_MAX_LENGTH) return true;
  }
  return false;
};

export const hasOverlongRefTitle = (text: string): boolean => {
  const wikiRegex = /[[^]]*\](?:|[^]]*)?\]/g;
  let m;
  while ((m = wikiRegex.exec(text)) !== null) {
    const displayPart = m[2] !== undefined ? m[2] : m[1];
    if (displayPart.length > TITLE_MAX_LENGTH) return true;
  }
  const linkRegex = /[[^]]*]\[[^)]*\]/g;
  while ((m = linkRegex.exec(text)) !== null) {
    if (m[1].length > TITLE_MAX_LENGTH) return true;
  }
  return false;
};

export const getTitleFromBody = (body: string): string => {
  const firstLine = body.split("\n")[0] || "";
  const h1AtStart = firstLine.startsWith("# ");
  const rawTitleFromStart = h1AtStart ? firstLine.substring(2).trim() : "";
  const lastH1Line =
    body
      .split("\n")
      .filter((l) => /^#\s+.+/.test(l))
      .pop() || "";
  const rawTitleFromEnd = lastH1Line.startsWith("# ")
    ? lastH1Line.substring(2).trim()
    : "";
  const rawTitle = rawTitleFromStart || rawTitleFromEnd;
  const sanitizedTitle = rawTitle
    .replace(/\s*\[\[[^\]]*\]\]\s*/g, "")
    .replace(/\s*@\S+\s*/g, "")
    .replace(/\s*\[[^\]]*\]\([^)]*\)\s*/g, "")
    .replace(/\s*>\s*/g, "")
    .trim()
    .slice(0, TITLE_MAX_LENGTH);
  return sanitizedTitle;
};

/** Display headline for a post: use title when set, otherwise first line of body (strip leading #, max 120 chars). */
export function getPostDisplayTitle(post: {
  title?: string | null;
  body: string;
}): string {
  const hasTitle = post.title != null && String(post.title).trim().length > 0;
  if (hasTitle) return String(post.title).trim();
  const body = post.body ?? "";
  const firstLine = body.includes("\n")
    ? body.slice(0, body.indexOf("\n")).trim()
    : body.trim();
  const withoutLeadingHash = firstLine.startsWith("# ")
    ? firstLine.slice(2).trim()
    : firstLine.startsWith("#")
      ? firstLine.slice(1).trim()
      : firstLine;
  return withoutLeadingHash.slice(0, 120);
}
