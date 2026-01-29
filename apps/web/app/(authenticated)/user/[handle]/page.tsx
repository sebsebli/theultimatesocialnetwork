import { ProfilePage } from "@/components/profile-page";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getUser(handle: string) {
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    redirect("/");
  }

  try {
    const res = await fetch(`${API_URL}/users/${handle}`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch user", e);
  }
  return null;
}

export default async function UserPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const params = await props.params;
  const user = await getUser(params.handle);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-secondary">User not found</p>
      </div>
    );
  }

  return <ProfilePage user={user} />;
}
