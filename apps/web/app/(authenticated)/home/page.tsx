import { ComposeEditor } from "@/components/compose-editor";
import { PostItem } from "@/components/post-item";
import { SavedByItem } from "@/components/saved-by-item";
import Link from "next/link";
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
      <header className="sticky top-0 z-10 bg-ink border-b border-divider px-4 py-3 md:bg-ink/80 md:backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center text-primary lg:hidden">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M11 5H7C4.5 9 4.5 15 7 19H11"></path>
                <path d="M13 5H17V19H13"></path>
              </svg>
            </div>
            <h1 className="text-base font-bold tracking-tight text-paper">
              Home
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 text-tertiary hover:text-primary transition-colors"
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
              className="p-2 text-tertiary hover:text-primary transition-colors"
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

      <div className="divide-y divide-divider">
        {posts.length === 0 ? (
          <div className="py-24 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-paper mb-2">
              Your timeline is quiet
            </h3>
            <p className="text-secondary text-base mb-8 max-w-sm mx-auto leading-relaxed">
              Follow people and topics to see their posts here. The best way to
              get started is to explore.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/explore"
                className="px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition-all font-semibold"
              >
                Explore Topics
              </Link>
              <Link
                href="/search"
                className="px-6 py-3 bg-white/5 text-paper border border-white/10 rounded-full hover:bg-white/10 transition-all font-semibold"
              >
                Find People
              </Link>
            </div>
          </div>
        ) : (
          posts.map(
            (item: {
              type: string;
              data?: {
                post?: { id: string };
                postId?: string;
                userId: string;
                userName: string;
                collectionId: string;
                collectionName: string;
              };
            }) => {
              // Handle FeedItem format: { type: 'post' | 'saved_by', data: ... }
              if (item.type === "saved_by" && item.data?.post) {
                return (
                  <SavedByItem
                    key={`saved-${item.data.post?.id || item.data.postId}-${item.data.userId}`}
                    userId={item.data.userId}
                    userName={item.data.userName}
                    collectionId={item.data.collectionId}
                    collectionName={item.data.collectionName}
                    post={item.data.post as any} // Cast to any to bypass strict type check for now, or ensure types align
                  />
                );
              } else if (item.type === "post" && item.data) {
                // Regular post
                return <PostItem key={(item.data as any).id} post={item.data as any} />;
              } else {
                // Fallback for direct post objects (backwards compatibility)
                return <PostItem key={(item as any).id} post={item as any} />;
              }
            },
          )
        )}
      </div>
    </>
  );
}
