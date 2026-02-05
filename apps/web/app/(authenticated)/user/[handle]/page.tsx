import { ProfilePage } from "@/components/profile-page";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

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
  const handle = params.handle;

  // /user/me → redirect to /user/{actualHandle} for parity with mobile
  if (handle === "me" || handle === "Me") {
    const API_URL = process.env.API_URL || "http://localhost:3000";
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return (
        <div className="flex items-center justify-center h-96 px-6">
          <div className="text-center">
            <p className="text-secondary mb-4">Sign in to view your profile.</p>
            <Link href="/sign-in" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      );
    }
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const me = await res.json();
        if (me?.handle) redirect(`/user/${encodeURIComponent(me.handle)}`);
      }
    } catch (e) {
      console.error("Failed to resolve /user/me", e);
    }
    return (
      <div className="flex items-center justify-center h-96 px-6">
        <div className="text-center">
          <p className="text-secondary mb-4">Could not load your profile.</p>
          <Link href="/home" className="text-primary hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const { user, isPublic } = await getUser(handle);

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
