import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing-page";

/**
 * Root route:
 * - If authenticated and no 'show_landing' param, redirect to /home.
 * - Otherwise show LandingPage (with isAuthenticated state).
 */
export default async function Home(props: {
  searchParams: Promise<{ show_landing?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = (await cookies()).get("token")?.value;
  const isAuthenticated = !!token && token.length > 0;

  if (isAuthenticated && !searchParams.show_landing) {
    redirect("/home");
  }

  return <LandingPage isAuthenticated={isAuthenticated} />;
}
