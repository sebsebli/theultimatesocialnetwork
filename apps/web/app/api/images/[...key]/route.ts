import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/lib/security";

/**
 * Proxy images from the backend so avatars and header images load even when
 * NEXT_PUBLIC_API_URL is not set (e.g. same-origin requests to /api/images/key).
 */
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ key: string[] }> }
) {
  const params = await props.params;
  const keySegment = params.key;
  if (!keySegment?.length) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }
  const key = keySegment.map((s) => decodeURIComponent(s)).join("/");
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const API_URL = getApiUrl().replace(/\/$/, "");
  // Nest API uses setGlobalPrefix('api'), so images are at /api/images/:key
  const base = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;
  const url = `${base}/images/${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const body = await res.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("Image proxy error:", e);
    return new NextResponse(null, { status: 502 });
  }
}
