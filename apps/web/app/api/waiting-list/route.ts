import { NextResponse } from "next/server";
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
    const email = sanitizeString(body.email);

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${API_URL}/waiting-list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data.message ?? "Failed to join waiting list" },
        { status: res.status >= 500 ? 500 : res.status },
      );
    }

    const data = await res
      .json()
      .catch(() => ({ message: "Joined waiting list" }));
    return NextResponse.json(data);
  } catch {
    const { error: msg, status } = createSecureErrorResponse(
      "Internal Error",
      500,
    );
    return NextResponse.json({ error: msg }, { status });
  }
}
