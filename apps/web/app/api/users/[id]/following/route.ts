import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/security";

const API_URL = getApiUrl();

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const token = (await cookies()).get("token")?.value;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}/users/${params.id}/following`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: res.status === 404 ? "Not found" : "Failed" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
