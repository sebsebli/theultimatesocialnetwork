import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif } from "next/font/google";
import { ReactNode } from "react";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CITE",
  description: "Link ideas like Wikipedia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${ibmPlexSerif.variable}`}>
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
