import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl, createSecureErrorResponse } from "@/lib/security";

const API_URL = getApiUrl();

export async function POST(request: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${API_URL}/users/me/request-deletion`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: body.reason?.trim() || undefined,
        lang: body.lang || "en",
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message ?? "Failed to request account deletion" },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    const err = createSecureErrorResponse("Internal Error", 500);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}
