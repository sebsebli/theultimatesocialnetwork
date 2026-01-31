import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl, createSecureErrorResponse } from "@/lib/security";

const API_URL = getApiUrl();

export async function GET() {
  const token = (await cookies()).get("token")?.value;
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/users/me/notification-prefs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) (await cookies()).delete("token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error(error);
    const err = createSecureErrorResponse("Internal Error", 500);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}

export async function PATCH(request: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const res = await fetch(`${API_URL}/users/me/notification-prefs`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok)
    return NextResponse.json({ error: "Failed" }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
