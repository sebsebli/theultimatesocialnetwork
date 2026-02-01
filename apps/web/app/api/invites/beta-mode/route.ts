import { NextResponse } from "next/server";
import { getApiUrl, createSecureErrorResponse } from "@/lib/security";

const API_URL = getApiUrl();

/** Public: returns { betaMode: boolean } so sign-in can show invite field first when in beta. */
export async function GET() {
  try {
    const res = await fetch(`${API_URL}/invites/beta-mode`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { betaMode: true },
        { status: 200 },
      );
    }

    const data = (await res.json()) as { betaMode?: boolean };
    return NextResponse.json({
      betaMode: typeof data.betaMode === "boolean" ? data.betaMode : true,
    });
  } catch {
    const err = createSecureErrorResponse("Internal Error", 500);
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
}
