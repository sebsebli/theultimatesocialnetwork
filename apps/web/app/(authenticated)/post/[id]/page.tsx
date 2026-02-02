import PostDetailDynamic from "./PostDetailDynamic";
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
      return { status: "ok", data: await res.json(), isPublic: !token };
    }

    if (res.status === 404 || res.status === 403) {
      return { status: "not-found" };
    }
  } catch (e) {
    console.error("Failed to fetch post", e);
  }
  return { status: "error" };
}

export default async function PostPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const result = await getPost(params.id);

  if (result.status === "not-found" || !result.data) {
    return (
      <div className="flex items-center justify-center h-96 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-paper mb-2">Unavailable</h1>
          <p className="text-secondary mb-4">
            This post is private or does not exist.
          </p>
          <a href="/sign-in" className="text-primary hover:underline">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const post = result.data;
  const isPublic =
    result.status === "ok" &&
    "isPublic" in result &&
    Boolean((result as { isPublic?: boolean }).isPublic);

  return <PostDetailDynamic post={post} isPublic={isPublic} />;
}
