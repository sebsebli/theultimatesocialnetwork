import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000";

async function proxy(
  request: NextRequest,
  postId: string,
  replyId: string,
  method: "POST" | "DELETE",
) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(
      `${API_URL}/posts/${postId}/replies/${replyId}/like`,
      {
        method,
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to update like" },
        { status: res.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Reply like error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; replyId: string }> },
) {
  const { id, replyId } = await props.params;
  return proxy(request, id, replyId, "POST");
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; replyId: string }> },
) {
  const { id, replyId } = await props.params;
  return proxy(request, id, replyId, "DELETE");
}
