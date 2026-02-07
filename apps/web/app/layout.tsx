import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Serif } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { RealtimeProvider } from "@/context/realtime-provider";
import { BetaModeProvider } from "@/context/beta-mode-provider";
import { ConsentAndSignup } from "@/components/consent-and-signup";
import { NotificationManager } from "@/components/notification-manager";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
} from "@/components/seo/json-ld";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://citewalk.com"),
  title: {
    default: "Citewalk — The European Social Network",
    template: "%s | Citewalk",
  },
  description:
    "Citewalk is a social network where ideas connect and grow. Post about what you know, follow topics you care about, and explore how ideas build on each other — transparently, without algorithms.",
  keywords: [
    "Citewalk",
    "European social network",
    "alternative social media",
    "EU hosted social network",
    "privacy-first social media",
    "no algorithm social media",
    "writing platform",
    "independent platform",
    "GDPR compliant social network",
    "European alternative to Twitter",
    "European alternative to X",
    "text-first social network",
    "citation-based social media",
    "ad-free social network",
    "social media without ads",
    "European tech",
    "digital sovereignty",
  ],
  authors: [{ name: "Dr. Sebastian Lindner", url: "https://citewalk.com" }],
  creator: "Dr. Sebastian Lindner",
  publisher: "Citewalk",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://citewalk.com",
    siteName: "Citewalk",
    title: "Citewalk — The European Social Network",
    description:
      "Citewalk is a social network where ideas connect and grow. Post about what you know, follow topics you care about, and explore how ideas build on each other — transparently, without algorithms.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Citewalk — Where ideas connect and grow.",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Citewalk — The European Social Network",
    description:
      "Citewalk is a social network where ideas connect and grow. Post about what you know, follow topics you care about, and explore how ideas build on each other — transparently, without algorithms.",
    images: ["/og-image.png"],
    creator: "@citewalk",
    site: "@citewalk",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://citewalk.com",
    types: {
      "application/rss+xml": "https://citewalk.com/feed.xml",
    },
  },
  category: "Social Networking",
  other: {
    "msapplication-TileColor": "#0B0B0C",
    "apple-mobile-web-app-title": "Citewalk",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`dark ${inter.variable} ${ibmPlexSerif.variable}`}
      suppressHydrationWarning
    >
      <body className={inter.className} suppressHydrationWarning>
        <OrganizationJsonLd />
        <SoftwareApplicationJsonLd />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <ToastProvider>
              <AuthProvider>
                <BetaModeProvider>
                  <RealtimeProvider>
                    <NotificationManager />
                    {children}
                    <ConsentAndSignup />
                  </RealtimeProvider>
                </BetaModeProvider>
              </AuthProvider>
            </ToastProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
