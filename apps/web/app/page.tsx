import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Root route:
 * - If authenticated, redirect to /home.
 * - If unauthenticated, redirect to /sign-in.
 * - The landing page/about page is at /about.
 */
export default async function Home() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  if (isAuthenticated) {
    redirect("/home");
  } else {
    redirect("/sign-in");
  }
}
