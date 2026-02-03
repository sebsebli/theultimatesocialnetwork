"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export default function OnboardingProfilePage() {
  const { error: toastError } = useToast();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [isProtected, setIsProtected] = useState(false);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHandle = useCallback(async (value: string) => {
    if (value.length < 3) {
      setHandleAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch(
        `/api/users/check-handle?handle=${encodeURIComponent(value)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setHandleAvailable(data.available);
      }
    } catch (error) {
      console.error("Error checking handle", error);
      setHandleAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (handle) checkHandle(handle);
    }, 500);
    return () => clearTimeout(timer);
  }, [handle, checkHandle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !handle || handleAvailable === false) return;

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          handle,
          bio,
          isProtected,
        }),
      });

      if (res.ok) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("onboarding_stage", "starter-packs");
        }
        router.push("/onboarding/starter-packs");
      } else {
        toastError("Failed to create profile");
      }
    } catch (error) {
      console.error("Error creating profile", error);
      toastError("Failed to create profile");
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 md:px-12 py-12 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md md:max-w-lg space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-paper mb-3">
            Create your profile
          </h1>
          <p className="text-secondary text-lg font-light">
            Set up your Citewalk identity. This is how others will recognize
            your thoughts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold uppercase tracking-widest text-secondary/60 ml-1">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your public name"
              className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-xl text-paper text-lg tracking-normal placeholder-tertiary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-bold uppercase tracking-widest text-secondary/60">
                Handle
              </label>
              {isChecking ? (
                <span className="text-[10px] font-mono text-tertiary animate-pulse">
                  Checking...
                </span>
              ) : handleAvailable === true ? (
                <span className="text-[10px] font-mono text-green-400 font-bold uppercase tracking-wider">
                  Available
                </span>
              ) : handleAvailable === false ? (
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                  Taken
                </span>
              ) : null}
            </div>
            <div className="relative group">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-primary transition-colors text-lg font-mono">
                @
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  const value = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "");
                  setHandle(value);
                }}
                placeholder="username"
                className={`w-full h-14 pl-10 pr-5 bg-white/5 border rounded-xl text-paper text-lg font-mono placeholder-tertiary/50 focus:outline-none focus:ring-2 transition-all shadow-inner ${
                  handleAvailable === false
                    ? "border-red-500/50 focus:ring-red-500/30"
                    : "border-white/10 focus:ring-primary/50"
                }`}
                required
                minLength={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-sm font-bold uppercase tracking-widest text-secondary/60">
                Bio
              </label>
              <span className="text-[10px] font-mono text-tertiary">
                {bio.length}/160
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="Writers, thinkers, curators... what connects your thoughts?"
              rows={3}
              className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-paper text-base placeholder-tertiary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all shadow-inner leading-relaxed"
            />
          </div>

          <div className="space-y-4 pt-2">
            <label className="block text-sm font-bold uppercase tracking-widest text-secondary/60 ml-1">
              Account Visibility
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsProtected(false)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  !isProtected
                    ? "bg-primary/10 border-primary/40 shadow-lg"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/5 opacity-60"
                }`}
              >
                <span className="font-bold text-paper mb-1">Open</span>
                <span className="text-[10px] text-tertiary uppercase font-bold tracking-tighter">
                  Public access
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsProtected(true)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  isProtected
                    ? "bg-primary/10 border-primary/40 shadow-lg"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/5 opacity-60"
                }`}
              >
                <span className="font-bold text-paper mb-1">Protected</span>
                <span className="text-[10px] text-tertiary uppercase font-bold tracking-tighter">
                  Follow approvals
                </span>
              </button>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={
                !displayName ||
                !handle ||
                isChecking ||
                handleAvailable === false
              }
              className="w-full h-14 bg-[#F2F2F2] text-[#0B0B0C] font-bold text-lg rounded-full hover:bg-white transition-all shadow-xl hover:shadow-white/10 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
            >
              Finish Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
