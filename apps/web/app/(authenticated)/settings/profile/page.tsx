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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [profileHeaderUrl, setProfileHeaderUrl] = useState<string | null>(null);
  const [profileHeaderKey, setProfileHeaderKey] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [headerUploading, setHeaderUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialHandle, setInitialHandle] = useState("");
  const [initialDisplayName, setInitialDisplayName] = useState("");
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [confirmUpdateVisible, setConfirmUpdateVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

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
            avatarUrl?: string | null;
            avatarKey?: string | null;
            profileHeaderUrl?: string | null;
            profileHeaderKey?: string | null;
          } | null,
        ) => {
          if (user) {
            setDisplayName(user.displayName ?? "");
            setHandle(user.handle ?? "");
            setInitialHandle(user.handle ?? "");
            setInitialDisplayName(user.displayName ?? "");
            setBio(user.bio ?? "");
            setIsProtected(user.isProtected ?? false);
            setAvatarUrl(user.avatarUrl ?? null);
            setAvatarKey(user.avatarKey ?? null);
            setProfileHeaderUrl(user.profileHeaderUrl ?? null);
            setProfileHeaderKey(user.profileHeaderKey ?? null);
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

  const updateMe = async (payload: {
    avatarKey?: string | null;
    profileHeaderKey?: string | null;
  }) => {
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update");
    return res.json();
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/profile-picture", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      const key = data?.key;
      if (!key) throw new Error("No key returned");
      const user = await updateMe({ avatarKey: key });
      setAvatarUrl(user?.avatarUrl ?? data?.url ?? null);
      setAvatarKey(key);
      toastSuccess(t("photoUpdated") || "Profile photo updated.");
    } catch {
      toastError(tCommon("error"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarKey && !avatarUrl) return;
    setAvatarUploading(true);
    try {
      await updateMe({ avatarKey: null });
      setAvatarUrl(null);
      setAvatarKey(null);
      toastSuccess(t("photoRemoved") || "Photo removed.");
    } catch {
      toastError(tCommon("error"));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleHeaderFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    setHeaderUploading(true);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/profile-header", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = res.ok ? await res.json() : null;
      const key = data?.key;
      if (!key) throw new Error("No key returned");
      const user = await updateMe({ profileHeaderKey: key });
      setProfileHeaderUrl(user?.profileHeaderUrl ?? data?.url ?? null);
      setProfileHeaderKey(key);
      toastSuccess(t("headerUpdated") || "Header image updated.");
    } catch {
      toastError(tCommon("error"));
    } finally {
      setHeaderUploading(false);
    }
  };

  const handleRemoveHeader = async () => {
    if (!profileHeaderKey && !profileHeaderUrl) return;
    setHeaderUploading(true);
    try {
      await updateMe({ profileHeaderKey: null });
      setProfileHeaderUrl(null);
      setProfileHeaderKey(null);
      toastSuccess(t("headerRemoved") || "Header image removed.");
    } catch {
      toastError(tCommon("error"));
    } finally {
      setHeaderUploading(false);
    }
  };

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
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFile}
        />
        <input
          ref={headerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleHeaderFile}
        />

        {/* Profile header (banner) */}
        <div className="relative -mx-4 mt-0">
          <div
            className="h-32 bg-white/5 border-y border-divider flex items-center justify-center overflow-hidden"
            onClick={() => headerUploading || headerInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") &&
              !headerUploading &&
              headerInputRef.current?.click()
            }
            aria-label="Change header image"
          >
            {headerUploading ? (
              <span className="text-tertiary text-sm">Uploading...</span>
            ) : profileHeaderUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={profileHeaderUrl}
                alt="Profile header"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-tertiary text-sm">
                Click to add header image
              </span>
            )}
          </div>
          {(profileHeaderUrl || profileHeaderKey) && !headerUploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveHeader();
              }}
              className="absolute top-2 right-2 px-2 py-1 rounded bg-ink/90 text-secondary text-xs hover:text-paper"
            >
              Remove
            </button>
          )}
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            disabled={avatarUploading}
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-28 h-28 rounded-full border-2 border-divider bg-white/5 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {avatarUploading ? (
              <span className="text-tertiary text-xs">Uploading...</span>
            ) : avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-tertiary">
                {(displayName || handle || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="text-sm text-primary hover:underline disabled:opacity-50"
            >
              {avatarUrl || avatarKey ? "Change photo" : "Add photo"}
            </button>
            {(avatarUrl || avatarKey) && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="text-sm text-tertiary hover:text-paper disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-divider rounded-xl flex gap-3 items-start">
          <svg className="w-4 h-4 text-tertiary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
              className={`w-full h-12 pl-8 pr-4 bg-white/5 border rounded-xl text-paper placeholder-tertiary ${isHandleChanged && handleStatus === "taken"
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
