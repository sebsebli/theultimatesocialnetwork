import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/security";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ code: string }> },
) {
  const { code } = await props.params;
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${getApiUrl()}/invites/${encodeURIComponent(code)}/revoke`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? "Failed to revoke" },
        { status: res.status },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite revoke error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
