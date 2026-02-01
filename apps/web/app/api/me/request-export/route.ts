import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl, createSecureErrorResponse } from "@/lib/security";

const API_URL = getApiUrl();

export async function POST() {
  const token = (await cookies()).get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${API_URL}/users/me/request-export`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        return NextResponse.json(
          {
            error:
              data.message ??
              "You can only request a data export once per 24 hours. Please try again later.",
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: data.message ?? "Failed to request export" },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Check your email for a download link. The link expires in 7 days and can only be used once.",
    });
  } catch {
    const err = createSecureErrorResponse("Internal Error", 500);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}
