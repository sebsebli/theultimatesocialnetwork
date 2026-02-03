import TopicPageDynamic from "./TopicPageDynamic";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";

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
  if (!slug) notFound();
  const topic = await getTopic(slug);
  if (!topic) notFound();
  return <TopicPageDynamic topic={topic} />;
}
