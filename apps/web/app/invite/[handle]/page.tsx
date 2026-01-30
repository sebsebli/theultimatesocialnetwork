"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

/**
 * Referral deep link: /invite/@handle or /invite/handle
 * Redirects to sign-in with ref param so the app can attribute the referral.
 */
export default function InviteHandlePage() {
  const params = useParams();
  const router = useRouter();
  const handleParam = (params?.handle as string) || "";
  const handle = handleParam.startsWith("@")
    ? handleParam.slice(1)
    : handleParam;

  useEffect(() => {
    if (!handle) return;
    // Redirect to sign-in with ref so user can sign up and we attribute referral
    const signInUrl = `/sign-in?ref=${encodeURIComponent(handle)}`;
    router.replace(signInUrl);
  }, [handle, router]);

  if (!handle) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Invalid invite link.</p>
        <Link href="/">Go home</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <p>Taking you to sign in…</p>
      <Link href={`/sign-in?ref=${encodeURIComponent(handle)}`}>
        Continue to sign in
      </Link>
    </div>
  );
}
