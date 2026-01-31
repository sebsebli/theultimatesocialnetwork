import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:3000";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Next.js route handler signature
export async function GET(request: Request) {
  const token = (await cookies()).get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${API_URL}/users/me/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed" }, { status: res.status });
  }

  const data = await res.json();

  // Return as downloadable file
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="Citewalk-data-export.json"',
    },
  });
}
