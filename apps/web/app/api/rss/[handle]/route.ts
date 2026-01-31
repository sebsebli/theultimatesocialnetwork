import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const handle = (await params).handle;

  try {
    // RSS endpoints are typically public
    const res = await fetch(`${API_URL}/rss/${encodeURIComponent(handle)}`);

    if (!res.ok) {
      return new NextResponse("Not found", { status: 404 });
    }

    const xml = await res.text();
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        // Optional: Add cache headers if needed
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching RSS:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
