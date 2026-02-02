import { cookies } from "next/headers";
import { LandingPage } from "@/components/landing-page";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Citewalk",
  description:
    "The sovereign knowledge graph. A quiet, verified social network designed for context.",
  alternates: {
    canonical: "https://citewalk.com/about",
  },
};

export default async function AboutPage() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  return <LandingPage isAuthenticated={isAuthenticated} />;
}
