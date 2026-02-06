import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getApiUrl,
  validateOrigin,
  createSecureErrorResponse,
} from "@/lib/security";

function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/\0/g, "").trim().slice(0, maxLength);
}

const API_URL = getApiUrl();

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const token = sanitizeString(body.token ?? "", 10);
    const tempToken = sanitizeString(body.tempToken ?? "", 2000);
    const deviceInfo = sanitizeString(body.deviceInfo ?? "", 500);

    if (!token || token.length !== 6) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    if (!tempToken) {
      return NextResponse.json({ error: "Session expired" }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/auth/2fa/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        tempToken,
        ...(deviceInfo ? { deviceInfo } : {}),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
    }

    const data = await res.json();
    const { accessToken, user } = data;

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Invalid response" }, { status: 500 });
    }

    (await cookies()).set("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true, user });
  } catch {
    const errorResponse = createSecureErrorResponse("Internal Error", 500);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status },
    );
  }
}
