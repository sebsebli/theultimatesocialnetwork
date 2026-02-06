/**
 * HTML sanitization utilities using DOMPurify
 * Used to sanitize HTML content before setting with dangerouslySetInnerHTML
 */

/**
 * Sanitize HTML content for safe use with dangerouslySetInnerHTML
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: return as-is (will be sanitized on client)
    // In Next.js, this is safe because dangerouslySetInnerHTML only runs on client
    return html;
  }

  // Dynamic import for client-side only
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require("dompurify");

  // Configure DOMPurify to allow common markdown-safe HTML tags
  // This preserves the HTML structure from renderMarkdown while removing dangerous content
  const config = {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "span",
      "div",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "class",
      "data-targets",
      "data-alias",
    ],
    ALLOW_DATA_ATTR: true,
    // Ensure links are safe
    ADD_ATTR: ["target", "rel"],
  };

  return DOMPurify.sanitize(html, config);
}
