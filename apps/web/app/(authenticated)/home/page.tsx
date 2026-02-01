import { ComposeEditor } from "@/components/compose-editor";
import { FeedList } from "@/components/feed-list";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getPosts() {
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/");
  }

  try {
    const res = await fetch(`${API_URL}/feed?limit=20&offset=0`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || [];
    }
    // Handle error statuses
    if (res.status === 401) redirect("/");
  } catch (e) {
    console.error("Failed to fetch posts", e);
  }
  return [];
}

export default async function HomeFeed() {
  const posts = await getPosts();

  return (
    <>
      <header className="sticky top-0 z-10 bg-ink border-b border-divider px-4 md:px-6 py-3 md:bg-ink/80 md:backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0 md:hidden">
              <Image
                src="/logo_transparent.png"
                alt=""
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-paper">
              Home
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="Search"
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-tertiary hover:text-primary transition-colors rounded-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>
            <Link
              href="/settings"
              aria-label="Settings"
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-tertiary hover:text-primary transition-colors rounded-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <ComposeEditor />

      <FeedList initialPosts={posts} />
    </>
  );
}
