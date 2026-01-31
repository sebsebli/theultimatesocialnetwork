import { ProfilePage } from "@/components/profile-page";
import { cookies } from "next/headers";
import Link from "next/link";

async function getUser(handle: string) {
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const token = (await cookies()).get("token")?.value;

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_URL}/users/${handle}`, {
      cache: "no-store",
      headers,
    });
    if (res.ok) {
      return { user: await res.json(), isPublic: !token };
    }
    if (res.status === 401 || res.status === 403) {
      return { user: null, isPublic: false };
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
  }
  return { user: null, isPublic: false };
}

export default async function UserPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const { user, isPublic } = await getUser(params.handle);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96 px-6">
        <div className="text-center">
          <p className="text-secondary mb-4">
            User not found or profile is private.
          </p>
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return <ProfilePage user={user} isPublic={isPublic} />;
}
