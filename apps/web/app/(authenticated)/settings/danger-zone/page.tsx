"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function DangerZonePage() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleRequestDeletion = async () => {
    setDeleting(true);
    try {
      const lang =
        (typeof navigator !== "undefined" &&
          (navigator.language || "").slice(0, 2)) ||
        "en";
      const res = await fetch("/api/me/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim() || undefined,
          lang,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setReason("");
        toastSuccess(
          "Check your email and click the link within 24 hours to delete your account.",
        );
        router.push("/settings");
      } else {
        const data = await res.json().catch(() => ({}));
        toastError(data.error ?? "Failed to request account deletion");
      }
    } catch (e) {
      toastError("Failed to request account deletion");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="text-secondary hover:text-paper"
            aria-label="Back"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-paper">Danger zone</h1>
          <div className="w-6" />
        </div>
      </header>

      <div className="px-6 py-6">
        <p className="text-secondary text-sm mb-6">
          These actions are permanent and cannot be undone.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          disabled={deleting}
          className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <span className="font-medium">Delete account</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => !deleting && setModalOpen(false)}
        >
          <div
            className="bg-ink border border-divider rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-paper mb-2">
              Delete account
            </h2>
            <p className="text-secondary text-sm mb-4">
              We will send you an email with a link to confirm. The link expires
              in 24 hours. Your data will be permanently deleted after
              confirmation.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary text-sm mb-4 resize-none"
              rows={2}
            />
            <div className="flex gap-3">
              <button
                onClick={() => !deleting && setModalOpen(false)}
                className="flex-1 py-3 rounded-lg border border-divider text-paper hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={deleting}
                className="flex-1 py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {deleting ? "Sending…" : "Send confirmation email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
