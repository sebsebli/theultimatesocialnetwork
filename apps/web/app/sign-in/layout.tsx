import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to Citewalk — the European social network. Access your chronological feed, write, cite, and connect with people who value substance over noise.",
  alternates: {
    canonical: "https://citewalk.com/sign-in",
  },
  openGraph: {
    title: "Sign In — Citewalk",
    description:
      "Sign in to the European alternative to algorithm-driven social media.",
    url: "https://citewalk.com/sign-in",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In — Citewalk",
    description:
      "Sign in to the European alternative to algorithm-driven social media.",
    images: ["/og-image.png"],
  },
};

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
