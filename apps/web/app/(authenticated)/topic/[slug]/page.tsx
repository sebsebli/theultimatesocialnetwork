import TopicPageDynamic from "./TopicPageDynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getTopic(slug: string) {
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/");
  }

  try {
    const res = await fetch(`${API_URL}/topics/${encodeURIComponent(slug)}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch topic", e);
  }
  return null;
}

export default async function TopicPageRoute(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const slug = params.slug?.trim();
  if (!slug) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <h2 className="text-xl font-semibold text-paper mb-2">
          Topic not found
        </h2>
        <Link
          href="/explore"
          className="text-primary hover:underline font-medium"
        >
          Browse topics
        </Link>
      </div>
    );
  }
  const topic = await getTopic(slug);

  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-paper mb-2">
          Topic not found
        </h2>
        <p className="text-secondary text-center max-w-sm mb-6">
          This topic may not exist or the link may be incorrect.
        </p>
        <Link
          href="/explore"
          className="text-primary hover:underline font-medium"
        >
          Browse topics
        </Link>
      </div>
    );
  }

  return <TopicPageDynamic topic={topic} />;
}
