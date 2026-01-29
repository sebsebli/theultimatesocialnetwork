import { ReadingMode } from "@/components/reading-mode";

async function getPost(id: string) {
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const DEV_TOKEN = process.env.DEV_TOKEN || "";

  try {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${DEV_TOKEN}`,
      },
    });
    if (res.ok) {
      return await res.json();
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
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-secondary">Post not found</p>
      </div>
    );
  }

  return <ReadingMode post={post} />;
}
