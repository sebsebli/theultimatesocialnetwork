import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import { RealtimeProvider } from "@/context/realtime-provider";
import { ConsentAndSignup } from "@/components/consent-and-signup";
import { NotificationManager } from "@/components/notification-manager";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

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
  title: "Citewalk | The Citation Network",
  description:
    "Citewalk is the text-first social network for verified information. Mobile-first, EU-hosted, and designed for context. Features offline reporting, data export, and RSS feeds. Join the beta.",
  keywords: [
    "Social Network",
    "Citation Graph",
    "Verified News",
    "Journalism Tool",
    "EU Hosting",
    "Data Sovereignty",
    "Alternative Social Media",
    "Citewalk",
  ],
  authors: [{ name: "Dr. Sebastian Lindner", url: "https://citewalk.com" }],
  creator: "Dr. Sebastian Lindner",
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
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <ToastProvider>
              <AuthProvider>
                <RealtimeProvider>
                  <NotificationManager />
                  {children}
                  <ConsentAndSignup />
                </RealtimeProvider>
              </AuthProvider>
            </ToastProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
