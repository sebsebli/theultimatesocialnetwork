import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/security";

const API_URL = getApiUrl();

/** Beta only: send invite by email. Requires auth. */
export async function POST(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body?.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const res = await fetch(`${API_URL}/invites/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, lang: body?.lang ?? "en" }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.error?.message ?? data?.message ?? data?.error ?? "Failed to send invitation";
    return NextResponse.json(
      typeof message === "string" ? { error: message } : { error: "Failed to send invitation" },
      { status: res.status },
    );
  }

  return NextResponse.json(data);
}
