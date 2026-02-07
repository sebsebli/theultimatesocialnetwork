import { getImageUrl } from "@/lib/security";

/**
 * Client-side hydration of @mention avatars in rendered markdown HTML.
 * Finds all `.mention-avatar[data-handle]` elements within a container
 * and fetches the user avatar to display as a background image.
 * Skips avatars that are already loaded (e.g. from inlineEnrichment).
 */
export function hydrateMentionAvatars(container: HTMLElement | null): void {
  if (!container) return;
  const avatarEls = container.querySelectorAll<HTMLSpanElement>(
    ".mention-avatar[data-handle]",
  );
  if (avatarEls.length === 0) return;

  const handles = new Set<string>();
  avatarEls.forEach((el) => {
    const h = el.getAttribute("data-handle");
    // Skip already-loaded avatars (set by inlineEnrichment in renderMarkdown)
    if (h && el.getAttribute("data-loaded") !== "true") handles.add(h);
  });

  if (handles.size === 0) return;

  handles.forEach((handle) => {
    fetch(`/api/users/${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (
          data: {
            avatarKey?: string;
            avatar_key?: string;
            avatarUrl?: string;
          } | null,
        ) => {
          if (!data) return;
          const avatarKey = data.avatarKey || data.avatar_key;
          const avatarUrl =
            data.avatarUrl || (avatarKey ? getImageUrl(avatarKey) : null);
          if (avatarUrl) {
            container
              .querySelectorAll<HTMLSpanElement>(
                `.mention-avatar[data-handle="${handle}"]`,
              )
              .forEach((el) => {
                el.style.backgroundImage = `url(${avatarUrl})`;
                el.setAttribute("data-loaded", "true");
              });
          }
        },
      )
      .catch(() => { });
  });
}
