import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const token = (await cookies()).get("token")?.value;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const limit = searchParams.get("limit") ?? "20";

  const res = await fetch(
    `${API_URL}/users/${params.id}/cited?page=${page}&limit=${limit}`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : undefined,
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
