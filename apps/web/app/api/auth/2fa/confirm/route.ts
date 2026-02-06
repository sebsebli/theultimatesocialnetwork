import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/security";

export async function POST(request: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const totpToken =
      typeof body?.token === "string" ? body.token.trim().slice(0, 10) : "";
    const secret =
      typeof body?.secret === "string" ? body.secret.trim().slice(0, 200) : "";

    if (!totpToken || totpToken.length !== 6 || !secret) {
      return NextResponse.json(
        { error: "Invalid code or secret" },
        { status: 400 },
      );
    }

    const res = await fetch(`${getApiUrl()}/auth/2fa/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: totpToken, secret }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.message ?? "Invalid code. Try again." },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("2FA confirm error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
