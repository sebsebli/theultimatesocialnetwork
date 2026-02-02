import { ComposeEditor } from "@/components/compose-editor";
import { FeedList } from "@/components/feed-list";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeHeader } from "@/components/home-header";

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
      <HomeHeader />

      <ComposeEditor />

      <FeedList initialPosts={posts} />
    </>
  );
}
