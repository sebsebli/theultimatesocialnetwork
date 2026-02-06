import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/security";

const API_URL = getApiUrl();

/**
 * POST /api/auth/refresh
 *
 * Uses the httpOnly refreshToken cookie to obtain a new access token
 * from the backend. Sets both updated cookies on success.
 * Called automatically by server-side fetch helpers on 401.
 */
export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken || typeof refreshToken !== "string") {
    return NextResponse.json(
      { error: "No refresh token" },
      { status: 401 },
    );
  }

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      // Refresh token invalid/expired — clear both cookies
      cookieStore.delete("token");
      cookieStore.delete("refreshToken");
      return NextResponse.json(
        { error: "Refresh failed" },
        { status: 401 },
      );
    }

    const data = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = data;

    if (!accessToken || typeof accessToken !== "string") {
      cookieStore.delete("token");
      cookieStore.delete("refreshToken");
      return NextResponse.json(
        { error: "Invalid response" },
        { status: 500 },
      );
    }

    const isProduction = process.env.NODE_ENV === "production";

    // Rotate: set new access token cookie
    cookieStore.set("token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 15,
      path: "/",
    });

    // Rotate: set new refresh token cookie
    if (newRefreshToken && typeof newRefreshToken === "string") {
      cookieStore.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Refresh failed" },
      { status: 500 },
    );
  }
}
