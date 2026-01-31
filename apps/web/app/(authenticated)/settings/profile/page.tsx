"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/toast";

const HANDLE_MIN = 3;
const HANDLE_MAX = 30;
const AVAILABILITY_DEBOUNCE_MS = 400;

export default function SettingsProfilePage() {
  const router = useRouter();
  const t = useTranslations("settings");
  const tOnboarding = useTranslations("onboarding.profile");
  const tCommon = useTranslations("common");
  const { success: toastSuccess, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialHandle, setInitialHandle] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [confirmUpdateVisible, setConfirmUpdateVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          user: {
            displayName?: string;
            handle?: string;
            bio?: string;
            isProtected?: boolean;
          } | null,
        ) => {
          if (user) {
            setDisplayName(user.displayName ?? "");
            setHandle(user.handle ?? "");
            setInitialHandle(user.handle ?? "");
            setInitialDisplayName(user.displayName ?? "");
            setBio(user.bio ?? "");
            setIsProtected(user.isProtected ?? false);
            if (user.handle) setHandleStatus("available");
          }
        },
      )
      .catch(() => toastError(tCommon("error")));
  }, [toastError, tCommon]);

  const normalizedHandle = handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
  const handleLen = normalizedHandle.length;
  const handleTooShort = handleLen > 0 && handleLen < HANDLE_MIN;
  const handleTooLong = handleLen > HANDLE_MAX;
  const isHandleChanged = normalizedHandle !== initialHandle;
  const isDisplayNameChanged = displayName.trim() !== initialDisplayName;
  const nameOrHandleChanged = isDisplayNameChanged || isHandleChanged;

  const checkAvailability = useCallback(
    async (h: string) => {
      if (!isHandleChanged) {
        setHandleStatus("available");
        return;
      }
      const norm = h
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      if (norm.length < HANDLE_MIN || norm.length > HANDLE_MAX) {
        setHandleStatus("invalid");
        return;
      }
      setHandleStatus("checking");
      try {
        const res = await fetch(
          `/api/users/check-handle?handle=${encodeURIComponent(norm)}`,
        );
        const data = res.ok ? await res.json() : null;
        setHandleStatus(data?.available ? "available" : "taken");
      } catch {
        setHandleStatus("idle");
      }
    },
    [isHandleChanged],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!isHandleChanged) {
      setHandleStatus("available");
      return;
    }
    if (handleLen === 0) {
      setHandleStatus("idle");
      return;
    }
    if (handleTooShort || handleTooLong) {
      setHandleStatus("invalid");
      return;
    }
    debounceRef.current = setTimeout(
      () => checkAvailability(handle),
      AVAILABILITY_DEBOUNCE_MS,
    );
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    handle,
    handleLen,
    handleTooShort,
    handleTooLong,
    checkAvailability,
    isHandleChanged,
  ]);

  const confirmUpdate = async () => {
    setConfirmUpdateVisible(false);
    setLoading(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          handle: normalizedHandle,
          bio: bio.trim(),
          isProtected,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toastSuccess(t("profileUpdated") || "Profile updated successfully.");
      router.back();
    } catch {
      toastError(tOnboarding("updateFailed") || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (
      !displayName.trim() ||
      normalizedHandle.length < HANDLE_MIN ||
      normalizedHandle.length > HANDLE_MAX ||
      handleStatus !== "available" ||
      loading
    )
      return;
    if (nameOrHandleChanged) setConfirmUpdateVisible(true);
    else confirmUpdate();
  };

  const canSubmit = Boolean(
    displayName.trim() &&
    normalizedHandle.length >= HANDLE_MIN &&
    normalizedHandle.length <= HANDLE_MAX &&
    handleStatus === "available" &&
    !loading,
  );

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="p-2 text-tertiary hover:text-primary transition-colors"
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
          <h1 className="text-xl font-bold text-paper">{t("editProfile")}</h1>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="text-primary font-semibold text-base disabled:opacity-50"
          >
            {tCommon("save")}
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        <div className="p-4 bg-white/5 border border-divider rounded-xl flex gap-2">
          <span className="text-tertiary mt-0.5">ℹ</span>
          <p className="text-secondary text-sm">
            You can only change your name and handle once every 14 days.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-paper mb-2">
            {tOnboarding("displayName")}
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full h-12 px-4 bg-white/5 border border-divider rounded-xl text-paper placeholder-tertiary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-paper mb-2">
            {tOnboarding("handle")}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">
              @
            </span>
            <input
              type="text"
              value={handle}
              onChange={(e) =>
                setHandle(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              placeholder="janedoe"
              maxLength={HANDLE_MAX}
              className={`w-full h-12 pl-8 pr-4 bg-white/5 border rounded-xl text-paper placeholder-tertiary ${
                isHandleChanged && handleStatus === "taken"
                  ? "border-red-500/50"
                  : handleStatus === "available"
                    ? "border-green-500/50"
                    : "border-divider"
              }`}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-tertiary">
            <span>
              {handleLen === 0
                ? tOnboarding("handleHint")
                : handleTooShort
                  ? tOnboarding("handleTooShort")
                  : handleTooLong
                    ? tOnboarding("handleTooLong")
                    : tOnboarding("handleHint")}
            </span>
            <span>
              {handleLen}/{HANDLE_MAX}
            </span>
          </div>
          {isHandleChanged &&
            handleLen >= HANDLE_MIN &&
            handleLen <= HANDLE_MAX && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                {handleStatus === "checking" && (
                  <span className="text-tertiary animate-pulse">
                    Checking...
                  </span>
                )}
                {handleStatus === "available" && (
                  <span className="text-green-500">
                    {tOnboarding("handleAvailable")}
                  </span>
                )}
                {handleStatus === "taken" && (
                  <span className="text-red-400">
                    {tOnboarding("handleTaken")}
                  </span>
                )}
              </div>
            )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-paper mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder={tOnboarding("bioPlaceholder")}
            rows={3}
            maxLength={160}
            className="w-full px-4 py-3 bg-white/5 border border-divider rounded-xl text-paper placeholder-tertiary resize-none"
          />
          <p className="text-right text-xs text-tertiary mt-1">
            {bio.length}/160
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsProtected(!isProtected)}
          className="w-full p-4 bg-white/5 border border-divider rounded-xl flex items-center justify-between text-left"
        >
          <div>
            <p className="font-semibold text-paper">
              {isProtected ? tCommon("private") : tCommon("public")}
            </p>
            <p className="text-sm text-secondary mt-1">
              {isProtected
                ? tOnboarding("privateDescription")
                : tOnboarding("publicDescription")}
            </p>
          </div>
          <span
            className={`inline-block w-12 h-7 rounded-full transition-colors relative ${isProtected ? "bg-primary" : "bg-white/10"}`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-200 ${isProtected ? "left-7" : "left-1"}`}
            />
          </span>
        </button>
      </div>

      {confirmUpdateVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-ink border border-divider rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-paper mb-2">
              Update profile?
            </h3>
            <p className="text-secondary text-sm mb-6">
              You will not be able to change your name or handle again for 14
              days.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmUpdateVisible(false)}
                className="flex-1 py-3 rounded-xl border border-divider text-paper font-semibold"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmUpdate}
                className="flex-1 py-3 rounded-xl bg-primary text-ink font-semibold"
              >
                {tCommon("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
