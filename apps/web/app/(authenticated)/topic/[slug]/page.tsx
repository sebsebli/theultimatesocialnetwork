import TopicPageDynamic from "./TopicPageDynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
  const topic = await getTopic(params.slug);

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-secondary">Topic not found</p>
      </div>
    );
  }

  return <TopicPageDynamic topic={topic} />;
}
