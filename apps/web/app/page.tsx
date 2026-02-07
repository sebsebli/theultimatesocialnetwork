import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LandingPage } from "@/components/landing-page";
import { FaqJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://citewalk.com",
  },
};

/**
 * Root route:
 * - If authenticated, redirect to /home.
 * - If unauthenticated, show the landing page.
 */
export default async function Home() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  if (isAuthenticated) {
    redirect("/home");
  }

  return (
    <>
      <FaqJsonLd
        questions={[
          {
            question: "What is Citewalk?",
            answer:
              "Citewalk is a social network where ideas connect and grow. Post about what you know, tag it to topics, and everyone following that topic sees it. Others can build on your ideas, creating a web of connected knowledge — all without algorithms deciding what you see.",
          },
          {
            question: "Is Citewalk free?",
            answer:
              "Citewalk is free to use — posting, reading, following topics, and exploring connections costs nothing. We offer an optional Citewalk Pro subscription for power users who want advanced citation analytics, extended formatting, and priority features. We never show ads or sell your data.",
          },
          {
            question: "Where is Citewalk hosted?",
            answer:
              "Citewalk is 100% hosted in the EU on Hetzner Cloud servers in Germany. All data stays within EU jurisdiction and is fully GDPR compliant.",
          },
          {
            question: "How is Citewalk different from Twitter, X, or Bluesky?",
            answer:
              "On other platforms, an algorithm decides who sees your content based on engagement metrics. On Citewalk, your posts reach everyone following the topics you write about. Others can build on your posts, creating visible citation chains. Discovery works through content connections, not user profiling.",
          },
          {
            question: "Can I export my data from Citewalk?",
            answer:
              "Yes. Citewalk offers full data export and provides RSS feeds for every profile. You can leave anytime and take everything with you — no lock-in, ever.",
          },
          {
            question: "How is Citewalk funded?",
            answer:
              "Citewalk is funded by optional Pro subscriptions and community support — never by advertising or data sales. We're building a sustainable company through honest value exchange, not attention exploitation.",
          },
          {
            question: "Who created Citewalk?",
            answer:
              "Citewalk was founded by Dr. Sebastian Lindner as an independent European project. It is not backed by venture capital or advertising revenue.",
          },
        ]}
      />
      <BreadcrumbJsonLd
        items={[{ name: "Home", url: "https://citewalk.com" }]}
      />
      <LandingPage isAuthenticated={false} />
    </>
  );
}
