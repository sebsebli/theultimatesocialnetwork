import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";

/**
 * Root route:
 * - If authenticated, redirect to /home.
 * - If unauthenticated, show the landing page.
 */
export default async function Home() {
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  if (isAuthenticated) {
    redirect("/home");
  }

  return <LandingPage isAuthenticated={false} />;
}
