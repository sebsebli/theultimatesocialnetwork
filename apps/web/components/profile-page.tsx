"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getImageUrl as getImageUrlFromKey } from "@/lib/security";
import { PostItem, Post } from "./post-item";
import { ProfileOptionsMenu } from "./profile-options-menu";
import { ImageUploader } from "./image-uploader";
import { PublicSignInBar } from "./public-sign-in-bar";
import { formatCompactNumber } from "@/lib/format";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { PostSkeleton, Skeleton } from "./skeletons";

interface Reply {
  id: string;
  postId: string;
  body: string;
}

interface Quote {
  id: string;
  body: string;
}

interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  itemCount: number;
  previewImageKey?: string | null;
  recentPost?: {
    id?: string;
    title?: string | null;
    bodyExcerpt?: string | null;
    headerImageKey?: string | null;
  } | null;
}

interface SavedItem {
  post: Post;
  // Other fields if necessary
}

interface ProfilePageProps {
  user: {
    id: string;
    handle: string;
    displayName: string;
    bio?: string;
    isProtected?: boolean;
    followerCount: number;
    followingCount: number;
    quoteReceivedCount: number;
    postCount?: number;
    replyCount?: number;
    collectionCount?: number;
    keepsCount?: number;
    posts?: Post[];
    avatarKey?: string;
    avatarUrl?: string;
    profileHeaderKey?: string;
    profileHeaderUrl?: string;
    isFollowing?: boolean;
    hasPendingFollowRequest?: boolean;
    isBlockedByMe?: boolean;
  };
  isSelf?: boolean;
  /** When true, viewer is not authenticated; hide Follow/Message and link to sign-in for connections */
  isPublic?: boolean;
}

function ReplySkeleton() {
  return (
    <div className="p-4 border-b border-divider animate-pulse">
      <div className="space-y-2">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-24 h-3 mt-2" />
      </div>
    </div>
  );
}

function CollectionSkeleton() {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden border border-white/10 bg-white/5 animate-pulse">
      <Skeleton className="w-full aspect-video" />
      <div className="p-4 space-y-2">
        <Skeleton className="w-3/4 h-5" />
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-1/2 h-4" />
        <Skeleton className="w-20 h-3 mt-1" />
      </div>
    </div>
  );
}

export function ProfilePage({
  user: initialUser,
  isSelf = false,
  isPublic = false,
}: ProfilePageProps) {
  const t = useTranslations("profile");
  const [user, setUser] = useState(initialUser);
  const [following, setFollowing] = useState(!!initialUser.isFollowing);
  const [hasPendingFollowRequest, setHasPendingFollowRequest] = useState(
    !!initialUser.hasPendingFollowRequest,
  );
  const [activeTab, setActiveTab] = useState<
    "posts" | "replies" | "quotes" | "cited" | "saved" | "collections"
  >("posts");
  const [loading, setLoading] = useState(false);
  const [tabData, setTabData] = useState<{
    replies: Reply[] | null;
    quotesReceived: Quote[] | null;
    cited: Post[] | null;
    collections: Collection[] | null;
    saved: SavedItem[] | null;
  }>({
    replies: null,
    quotesReceived: null,
    cited: null,
    collections: null,
    saved: null,
  });
  const { success: toastSuccess, error: toastError } = useToast();
  const [profileImageUploading, setProfileImageUploading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (activeTab === "replies" && !tabData.replies) {
        try {
          const res = await fetch(`/api/users/${user.id}/replies`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setTabData((prev) => ({ ...prev, replies: data.items || data }));
          }
        } catch {
          /* ignore */
        }
      } else if (activeTab === "quotes" && !tabData.quotesReceived) {
        try {
          const res = await fetch(`/api/users/${user.id}/quotes`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setTabData((prev) => ({
              ...prev,
              quotesReceived: data.items || data,
            }));
          }
        } catch {
          /* ignore */
        }
      } else if (activeTab === "cited" && !tabData.cited) {
        try {
          const res = await fetch(`/api/users/${user.id}/cited`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setTabData((prev) => ({
              ...prev,
              cited: data.items || data || [],
            }));
          }
        } catch {
          /* ignore */
        }
      } else if (activeTab === "collections" && !tabData.collections) {
        try {
          const res = await fetch(`/api/users/${user.id}/collections`);
          if (res.ok && isMounted) {
            const data = await res.json();
            setTabData((prev) => ({
              ...prev,
              collections: data.items || data,
            }));
          }
        } catch {
          /* ignore */
        }
      } else if (activeTab === "saved" && isSelf && !tabData.saved) {
        try {
          const res = await fetch(`/api/keeps?limit=20`);
          if (res.ok && isMounted) {
            const data = await res.json();
            const items = Array.isArray(data) ? data : (data?.items ?? []);
            setTabData((prev) => ({ ...prev, saved: items }));
          }
        } catch {
          /* ignore */
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [
    activeTab,
    tabData.replies,
    tabData.quotesReceived,
    tabData.cited,
    tabData.collections,
    tabData.saved,
    user.id,
    isSelf,
  ]);

  const handleFollow = async () => {
    if (isSelf) return;

    setLoading(true);
    try {
      if (following || hasPendingFollowRequest) {
        const res = await fetch(`/api/users/${user.id}/follow`, {
          method: "DELETE",
        });
        if (res.ok) {
          setFollowing(false);
          setHasPendingFollowRequest(false);
        }
      } else {
        const res = await fetch(`/api/users/${user.id}/follow`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.pending) {
            setHasPendingFollowRequest(true);
          } else {
            setFollowing(true);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const updateProfileImage = async (
    key: string | null,
    type: "avatar" | "header",
  ) => {
    try {
      const body =
        type === "avatar" ? { avatarKey: key } : { profileHeaderKey: key };
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setUser((prev) => ({
          ...prev,
          ...(type === "avatar"
            ? { avatarKey: key ?? undefined }
            : { profileHeaderKey: key ?? undefined }),
        }));
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to update profile image", e);
    }
  };

  const handleUnblock = async () => {
    try {
      const res = await fetch(`/api/safety/block/${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toastSuccess("User unblocked");
        window.location.reload();
      } else {
        throw new Error();
      }
    } catch {
      toastError("Failed to unblock user");
    }
  };

  const getImageUrl = (key?: string, url?: string) => {
    if (key) return getImageUrlFromKey(key);
    return url;
  };

  const headerUrl = getImageUrl(user.profileHeaderKey, user.profileHeaderUrl);
  const avatarUrl = getImageUrl(user.avatarKey, user.avatarUrl);

  if (user.isBlockedByMe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-paper mb-2">
          You have blocked this account
        </h2>
        <p className="text-secondary text-center max-w-sm mb-6">
          You cannot view this profile while blocked. Unblock to see their posts
          and profile.
        </p>
        <button
          onClick={handleUnblock}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Unblock
        </button>
        <Link
          href="/home"
          className="mt-4 text-tertiary hover:text-paper text-sm"
        >
          Go Home
        </Link>
      </div>
    );
  }

  type ProfileTab =
    | "posts"
    | "replies"
    | "quotes"
    | "cited"
    | "saved"
    | "collections";
  /** Tab order matches mobile: own profile includes replies + saved; other profiles include replies, no saved */
  const visibleTabs: ProfileTab[] = isPublic
    ? ["posts"]
    : isSelf
      ? ["posts", "replies", "quotes", "cited", "saved", "collections"]
      : ["posts", "replies", "quotes", "cited", "collections"];

  return (
    <div className={`min-h-screen ${isPublic ? "pb-28" : "pb-28"}`}>
      {/* Profile Top Section (Header + Avatar + Info) */}
      <div className="relative">
        {/* Header Image Background: fixed 16:9 aspect ratio */}
        <div className="w-full aspect-video bg-ink relative overflow-hidden">
          {headerUrl ? (
            <Image
              src={headerUrl}
              alt="Header"
              fill
              className="object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-ink/50 to-ink" />
          )}

          {/* Header Controls (Back & Options) */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
            <Link
              href={isPublic ? "/" : "/home"}
              className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/40 transition-colors"
              aria-label="Back"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>

            <div className="flex gap-2">
              {isSelf && (
                <>
                  <button
                    onClick={() =>
                      document.getElementById("header-upload")?.click()
                    }
                    className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-black/40 transition-colors"
                    title="Edit Header"
                    aria-label="Edit header image"
                  >
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  {user.profileHeaderKey && (
                    <button
                      onClick={() => updateProfileImage(null, "header")}
                      className="p-2 bg-black/20 backdrop-blur-sm rounded-full text-white hover:bg-red-500/80 transition-colors"
                      title="Remove Header"
                      aria-label="Remove header image"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                  <div className="hidden">
                    <ImageUploader
                      id="header-upload"
                      onUploadComplete={(key) =>
                        updateProfileImage(key, "header")
                      }
                      onUploadStateChange={setProfileImageUploading}
                    />
                  </div>
                </>
              )}
              {!isPublic && (
                <ProfileOptionsMenu
                  handle={user.handle}
                  userId={user.id}
                  isSelf={isSelf}
                />
              )}
            </div>
          </div>
        </div>

        {/* Profile Info Overlay (Avatar + Name) */}
        <div className="relative px-6 -mt-16 flex flex-col items-center">
          <div className="relative group">
            <div className="h-32 w-32 rounded-full border-4 border-ink bg-ink overflow-hidden relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={user.displayName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-4xl">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {isSelf && (
              <>
                <button
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                  className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Edit avatar"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                <div className="hidden">
                  <ImageUploader
                    id="avatar-upload"
                    onUploadComplete={(key) =>
                      updateProfileImage(key, "avatar")
                    }
                    onUploadStateChange={setProfileImageUploading}
                  />
                </div>
              </>
            )}
            {profileImageUploading && (
              <p className="text-xs text-tertiary animate-pulse mt-2 text-center">
                Uploading & verifying image…
              </p>
            )}
          </div>

          <div className="text-center mt-3 mb-6">
            <h1 className="text-2xl font-bold text-paper mb-1">
              {user.displayName}
            </h1>
            <p className="text-tertiary text-sm font-medium">@{user.handle}</p>

            {user.bio && (
              <p className="text-secondary text-[15px] text-center max-w-[320px] leading-relaxed mt-3 mx-auto">
                {user.bio}
              </p>
            )}

            {!isSelf && !isPublic && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={handleFollow}
                  disabled={loading}
                  className={`px-6 py-2 rounded-full border transition-colors disabled:opacity-50 font-medium text-sm ${following || hasPendingFollowRequest
                      ? "bg-primary border-primary text-white"
                      : "border-primary text-primary hover:bg-primary/10"
                    }`}
                >
                  {loading
                    ? "..."
                    : hasPendingFollowRequest
                      ? "Requested"
                      : following
                        ? "Following"
                        : "Follow"}
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/messages/threads", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      if (res.ok) {
                        const thread = await res.json();
                        window.location.href = `/inbox?thread=${thread.id}`;
                      }
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="px-6 py-2 rounded-full border border-divider text-paper hover:bg-white/10 transition-colors font-medium text-sm"
                >
                  Message
                </button>
              </div>
            )}
            {!isSelf && isPublic && (
              <Link
                href="/sign-in"
                className="inline-block mt-4 px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 font-medium text-sm transition-colors"
              >
                Sign in to follow
              </Link>
            )}
          </div>

          {/* Followers / Following */}
          {(isSelf || !isPublic) && (
            <div className="flex justify-center pb-4 w-full border-b border-divider">
              <p className="text-tertiary text-xs font-medium uppercase tracking-wider">
                {!isPublic ? (
                  <>
                    <Link
                      href={`/user/${user.handle}/connections?tab=followers`}
                      className="text-tertiary hover:text-primary transition-colors"
                    >
                      {formatCompactNumber(user.followerCount)} followers
                    </Link>
                    {" · "}
                    <Link
                      href={`/user/${user.handle}/connections?tab=following`}
                      className="text-tertiary hover:text-primary transition-colors"
                    >
                      {formatCompactNumber(user.followingCount)} following
                    </Link>
                  </>
                ) : (
                  <>
                    {formatCompactNumber(user.followerCount)} followers ·{" "}
                    {formatCompactNumber(user.followingCount)} following
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Private profile gate: hide tabs and content when protected and we don't follow */}
      {!isSelf && user.isProtected && !following && (
        <div className="flex flex-col items-center justify-center py-16 px-6 border-b border-divider">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-tertiary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <p className="text-paper font-semibold text-lg">Private profile</p>
          <p className="text-secondary text-sm text-center max-w-[280px] mt-1">
            Follow this account to see their posts, replies, and cites.
          </p>
        </div>
      )}

      {/* Tabs */}
      {!(!isSelf && user.isProtected && !following) && (
        <>
          <div className="sticky top-0 z-10 bg-ink border-b border-divider w-full">
            <div className="flex justify-between items-center w-full px-4 md:px-6 overflow-x-auto overflow-y-hidden no-scrollbar min-w-0">
              {visibleTabs.map((tab) => {
                const count =
                  tab === "posts"
                    ? ((user as { postCount?: number }).postCount ?? 0)
                    : tab === "replies"
                      ? ((user as { replyCount?: number }).replyCount ?? 0)
                      : tab === "quotes"
                        ? (user.quoteReceivedCount ?? 0)
                        : tab === "saved"
                          ? ((user as { keepsCount?: number }).keepsCount ?? 0)
                          : tab === "collections"
                            ? ((user as { collectionCount?: number })
                              .collectionCount ?? 0)
                            : tab === "cited"
                              ? undefined
                              : 0;
                const label =
                  tab === "replies"
                    ? t("comments")
                    : tab === "posts"
                      ? t("posts")
                      : tab === "quotes"
                        ? t("cites")
                        : tab === "cited"
                          ? t("cited")
                          : tab === "saved"
                            ? t("saved")
                            : tab === "collections"
                              ? t("collections")
                              : tab;
                const showCount =
                  tab !== "replies" && count != null && count > 0;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    type="button"
                    className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap tabular-nums ${activeTab === tab
                        ? "border-primary text-paper"
                        : "border-transparent text-tertiary hover:text-paper"
                      }`}
                  >
                    {label} {showCount ? `(${formatCompactNumber(count)})` : ""}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keeps Library Link (only on Saved tab) */}
          {isSelf && activeTab === "saved" && (
            <Link
              href="/keeps"
              className="flex items-center gap-3 px-6 py-4 border-b border-divider bg-white/[0.02] hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-paper">
                  Keeps Library
                </h3>
                <p className="text-xs text-tertiary">
                  Search & add to collections
                </p>
              </div>
              <svg
                className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors"
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
            </Link>
          )}

          {/* Create & manage collections (only on Collections tab, self) */}
          {isSelf && activeTab === "collections" && (
            <Link
              href="/collections"
              className="flex items-center gap-3 px-6 py-4 border-b border-divider bg-white/[0.02] hover:bg-white/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-paper">
                  Create & manage collections
                </h3>
                <p className="text-xs text-tertiary">
                  Add new collection or open full list
                </p>
              </div>
              <svg
                className="w-5 h-5 text-tertiary group-hover:text-primary transition-colors"
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
            </Link>
          )}

          {/* Content */}
          <div className="px-6 py-6">
            {activeTab === "posts" && (
              <div className="space-y-0">
                {user.posts && user.posts.length > 0 ? (
                  user.posts.map((post) => (
                    <PostItem
                      key={post.id}
                      post={post}
                      isAuthor={isSelf}
                      isPublic={isPublic}
                    />
                  ))
                ) : (
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      icon="article"
                      headline="No posts yet"
                      compact
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "replies" && (
              <div className="space-y-0">
                {tabData.replies && tabData.replies.length > 0 ? (
                  tabData.replies.map((reply) => (
                    <Link key={reply.id} href={`/post/${reply.postId}`}>
                      <div className="p-4 border-b border-divider hover:bg-white/5 transition-colors">
                        <p className="text-secondary text-sm">{reply.body}</p>
                        <p className="text-tertiary text-xs mt-2">
                          {t("replyToPost")}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : tabData.replies === null ? (
                  <div className="space-y-0">
                    <ReplySkeleton />
                    <ReplySkeleton />
                    <ReplySkeleton />
                  </div>
                ) : (
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      icon="chat_bubble_outline"
                      headline={t("noCommentsYet")}
                      compact
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "quotes" && (
              <div className="space-y-0">
                {tabData.quotesReceived && tabData.quotesReceived.length > 0 ? (
                  tabData.quotesReceived.map((quote) => (
                    <PostItem
                      key={quote.id}
                      post={quote as unknown as Post}
                      isPublic={isPublic}
                    />
                  ))
                ) : tabData.quotesReceived === null ? (
                  <div className="space-y-0">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : (
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      icon="format_quote"
                      headline={t("noCites")}
                      subtext={t("noCitesHint")}
                      compact
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "cited" && (
              <div className="space-y-0">
                {tabData.cited && tabData.cited.length > 0 ? (
                  tabData.cited.map((post) => (
                    <PostItem key={post.id} post={post} isPublic={isPublic} />
                  ))
                ) : tabData.cited === null ? (
                  <div className="space-y-0">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : (
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      icon="link"
                      headline={t("noCited")}
                      subtext={t("noCitedHint")}
                      compact
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "collections" && (
              <div className="space-y-4">
                {tabData.collections && tabData.collections.length > 0 ? (
                  tabData.collections.map((collection) => {
                    const imageUrl =
                      (collection.recentPost?.headerImageKey
                        ? getImageUrlFromKey(
                          collection.recentPost.headerImageKey,
                        )
                        : null) ||
                      (collection.previewImageKey
                        ? getImageUrlFromKey(collection.previewImageKey)
                        : null);
                    const previewText =
                      collection.recentPost?.title?.trim() ||
                      collection.recentPost?.bodyExcerpt?.trim() ||
                      collection.description ||
                      "";
                    return (
                      <Link
                        key={collection.id}
                        href={`/collections/${collection.id}`}
                        className="flex flex-col rounded-lg overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="relative w-full aspect-video shrink-0 bg-divider">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 420px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-tertiary">
                              <svg
                                className="w-10 h-10"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-paper mb-0.5 truncate">
                            {collection.title}
                          </h3>
                          {previewText ? (
                            <p className="text-secondary text-sm line-clamp-2">
                              {previewText}
                            </p>
                          ) : null}
                          <p className="text-tertiary text-xs mt-1">
                            {collection.itemCount ?? 0} items
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : tabData.collections === null ? (
                  <div className="space-y-4">
                    <CollectionSkeleton />
                    <CollectionSkeleton />
                    <CollectionSkeleton />
                  </div>
                ) : (
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      icon="folder_open"
                      headline="No collections yet"
                      compact
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "saved" && isSelf && (
              <div className="space-y-0 -mx-6">
                {tabData.saved && tabData.saved.length > 0 ? (
                  tabData.saved.map((item) => (
                    <div key={item.post.id} className="border-b border-divider">
                      <PostItem
                        post={{ ...item.post, isKept: true }}
                        onKeep={() =>
                          setTabData((prev) => ({
                            ...prev,
                            saved:
                              prev.saved?.filter(
                                (s) => s.post.id !== item.post.id,
                              ) ?? [],
                          }))
                        }
                      />
                    </div>
                  ))
                ) : tabData.saved === null ? (
                  <div className="space-y-0">
                    <PostSkeleton />
                    <PostSkeleton />
                    <PostSkeleton />
                  </div>
                ) : (
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      icon="bookmark_border"
                      headline="No saved posts yet"
                      subtext="Bookmark posts to see them here."
                      compact
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {isPublic && <PublicSignInBar message="Sign in to follow and interact" />}
    </div>
  );
}
