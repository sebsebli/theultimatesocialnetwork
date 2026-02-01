import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const sort = searchParams.get("sort");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const q = new URLSearchParams();
    if (sort) q.set("sort", sort);
    if (page) q.set("page", page);
    if (limit) q.set("limit", limit);
    const query = q.toString();
    const url = query
      ? `${API_URL}/explore/newsroom?${query}`
      : `${API_URL}/explore/newsroom`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch newsroom" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching newsroom", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
