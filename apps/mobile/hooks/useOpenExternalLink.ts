import { useOpenExternalLink as useOpenExternalLinkContext } from "../context/ExternalLinkContext";

/**
 * Opens external URLs in the in-app browser (SFSafariViewController / Chrome Custom Tabs)
 * after showing a custom "leaving the app" confirmation modal (app design).
 */
export function useOpenExternalLink() {
  return useOpenExternalLinkContext();
}
