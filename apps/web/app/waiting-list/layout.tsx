import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Join the Waiting List",
  description:
    "Join the Citewalk waiting list. Be among the first to access the European social network that puts quality writing first — no algorithms, no ads, no tracking.",
  alternates: {
    canonical: "https://citewalk.com/waiting-list",
  },
  openGraph: {
    title: "Join the Waiting List — Citewalk",
    description:
      "Be among the first to access the European social network that puts quality writing first.",
    url: "https://citewalk.com/waiting-list",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Waiting List — Citewalk",
    description:
      "Be among the first to access the European social network that puts quality writing first.",
    images: ["/og-image.png"],
  },
};

export default function WaitingListLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
