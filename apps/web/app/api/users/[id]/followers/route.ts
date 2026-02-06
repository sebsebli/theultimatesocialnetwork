import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/server-fetch";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? "50";
  const offset = url.searchParams.get("offset") ?? "0";

  try {
    const result = await serverFetch(
      `/users/${params.id}/followers?limit=${limit}&offset=${offset}`,
      { optional: true },
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: result.status === 404 ? "Not found" : "Failed" },
        { status: result.status },
      );
    }
    return NextResponse.json(result.data);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
