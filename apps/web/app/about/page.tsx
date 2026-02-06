import { permanentRedirect } from "next/navigation";

/**
 * /about now redirects to / which serves the landing page for
 * unauthenticated visitors. This avoids duplicate content.
 */
export default function AboutPage() {
  permanentRedirect("/");
}
