/**
 * JSON-LD Structured Data components for SEO.
 * Provides Schema.org markup for Organization, WebSite, WebPage, and more.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + WebSite schema — placed in root layout */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://citewalk.com/#organization",
        name: "Citewalk",
        url: "https://citewalk.com",
        logo: {
          "@type": "ImageObject",
          url: "https://citewalk.com/icon.png",
          width: 512,
          height: 512,
        },
        description:
          "Citewalk is a social network where ideas connect and grow. Post about what you know, follow topics you care about, and explore how ideas build on each other — transparently, without algorithms.",
        foundingDate: "2025",
        founder: {
          "@type": "Person",
          name: "Dr. Sebastian Lindner",
          url: "https://citewalk.com",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "hello@citewalk.com",
          contactType: "customer support",
        },
        sameAs: [],
        areaServed: {
          "@type": "Place",
          name: "Europe",
        },
        knowsAbout: [
          "social networking",
          "European digital sovereignty",
          "privacy-first social media",
          "citation-based reputation",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://citewalk.com/#website",
        url: "https://citewalk.com",
        name: "Citewalk",
        description:
          "Citewalk is a social network where ideas connect and grow.",
        publisher: {
          "@id": "https://citewalk.com/#organization",
        },
        inLanguage: ["en", "de"],
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://citewalk.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return <JsonLd data={data} />;
}

/** WebPage schema for static pages */
export function WebPageJsonLd({
  title,
  description,
  url,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  dateModified?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}/#webpage`,
    url,
    name: title,
    description,
    isPartOf: {
      "@id": "https://citewalk.com/#website",
    },
    about: {
      "@id": "https://citewalk.com/#organization",
    },
    inLanguage: "en",
    ...(dateModified && { dateModified }),
  };

  return <JsonLd data={data} />;
}

/** FAQ schema for pages with FAQ-style content */
export function FaqJsonLd({
  questions,
}: {
  questions: Array<{ question: string; answer: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

/** SoftwareApplication schema for app store listings / product pages */
export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Citewalk",
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "Citewalk is a social network where ideas connect and grow. Post about what you know, follow topics you care about, and explore how ideas build on each other — transparently, without algorithms.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    author: {
      "@id": "https://citewalk.com/#organization",
    },
    featureList: [
      "Chronological feed — no algorithm",
      "Inline citations and topic linking",
      "Private like counts, public references",
      "EU-hosted, GDPR compliant",
      "Full data export and RSS feeds",
      "No ads, no tracking",
    ],
  };

  return <JsonLd data={data} />;
}

/** BreadcrumbList schema */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}
