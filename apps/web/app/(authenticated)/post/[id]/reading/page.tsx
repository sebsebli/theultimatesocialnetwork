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
      return { data: await res.json(), isPublic: !token };
    }
    if (res.status === 403 || res.status === 404) {
      return { data: null, isPublic: !token };
    }
  } catch (e) {
    console.error("Failed to fetch post", e);
  }
  return { data: null, isPublic: true };
}

export default async function ReadingModePage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const result = await getPost(params.id);

  if (!result.data) {
    notFound();
  }

  return <ReadingMode post={result.data} isPublic={result.isPublic} />;
}
