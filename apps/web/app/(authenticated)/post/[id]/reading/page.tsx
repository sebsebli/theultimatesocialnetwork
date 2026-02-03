import { notFound } from "next/navigation";
import { ReadingMode } from "@/components/reading-mode";
import { cookies } from "next/headers";

async function getPost(id: string) {
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const token = (await cookies()).get("token")?.value;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return await res.json();
    }
    if (res.status === 403 || res.status === 404) {
      return null;
    }
  } catch (e) {
    console.error("Failed to fetch post", e);
  }
  return null;
}

export default async function ReadingModePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const post = await getPost(params.id);

  if (!post) {
    notFound();
  }

  return <ReadingMode post={post} />;
}
