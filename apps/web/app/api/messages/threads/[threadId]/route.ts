import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ threadId: string }> },
) {
  const params = await props.params;
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${API_URL}/messages/threads/${params.threadId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to delete conversation" },
        { status: res.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting thread", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
