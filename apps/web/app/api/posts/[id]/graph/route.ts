import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const token = (await cookies()).get("token")?.value;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}/posts/${params.id}/graph`, {
      headers,
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch graph" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching graph", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
