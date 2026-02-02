import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/security";

/** Public: returns { betaMode: boolean } so sign-in can show invite field first when in beta. */
export async function GET() {
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/invites/beta-mode`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ betaMode: true }, { status: 200 });
    }

    const text = await res.text();
    if (!text?.trim()) {
      return NextResponse.json({ betaMode: true }, { status: 200 });
    }
    let data: { betaMode?: boolean };
    try {
      data = JSON.parse(text) as { betaMode?: boolean };
    } catch {
      return NextResponse.json({ betaMode: true }, { status: 200 });
    }
    return NextResponse.json({
      betaMode: typeof data.betaMode === "boolean" ? data.betaMode : true,
    });
  } catch {
    // Backend unreachable, wrong API_URL, or network error: safe default so sign-in always works
    return NextResponse.json({ betaMode: true }, { status: 200 });
  }
}
