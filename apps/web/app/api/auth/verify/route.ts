import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getApiUrl,
  validateOrigin,
  createSecureErrorResponse,
} from "@/lib/security";

function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function validateToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  return /^[a-zA-Z0-9-]{4,50}$/.test(token); // Updated regex to allow UUIDs
}

function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/\0/g, "").trim().slice(0, maxLength);
}

const API_URL = getApiUrl();

export async function POST(request: Request) {
  // Validate origin (CSRF protection)
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Input validation
    const email = sanitizeString(body.email);
    const token = sanitizeString(body.token);
    const deviceInfo = sanitizeString(body.deviceInfo ?? "", 500);

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!validateToken(token)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const res = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token,
        ...(deviceInfo ? { deviceInfo } : {}),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const data = await res.json();

    if (data.twoFactorRequired && data.tempToken) {
      return NextResponse.json({
        twoFactorRequired: true,
        tempToken: data.tempToken,
      });
    }

    const { accessToken, refreshToken, user } = data;

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json({ error: "Invalid response" }, { status: 500 });
    }

    const needsOnboarding =
      typeof user?.handle === "string" && user.handle.startsWith("__pending_");

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    // Set short-lived access token cookie (15 minutes)
    cookieStore.set("token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes — matches JWT expiry
      path: "/",
    });

    // Set long-lived refresh token cookie (7 days)
    if (refreshToken && typeof refreshToken === "string") {
      cookieStore.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return NextResponse.json({ success: true, user, needsOnboarding });
  } catch (_error) {
    const errorResponse = createSecureErrorResponse("Internal Error", 500);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.status },
    );
  }
}
