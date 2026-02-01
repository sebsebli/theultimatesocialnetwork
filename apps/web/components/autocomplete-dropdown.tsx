"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Avatar } from "./avatar";
import { getImageUrl } from "@/lib/security";

interface AutocompleteItem {
  id: string;
  type: "topic" | "post" | "user";
  title: string;
  subtitle?: string;
  slug?: string;
  /** User: profile image */
  avatarKey?: string | null;
  avatarUrl?: string | null;
  /** Post: header image */
  headerImageKey?: string | null;
  headerImageUrl?: string | null;
}

interface AutocompleteDropdownProps {
  query: string;
  type: "topic" | "post" | "user" | "all";
  onSelect: (item: AutocompleteItem) => void;
  position: { top: number; left: number };
  onClose: () => void;
}

export function AutocompleteDropdown({
  query,
  type,
  onSelect,
  position,
  onClose,
}: AutocompleteDropdownProps) {
  const t = useTranslations("compose");
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      return;
    }

    const timer = setTimeout(() => {
      loadSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const loadSuggestions = async () => {
    setLoading(true);
    setItems([]);
    const limit = type === "all" ? 6 : 10;
    try {
      if (type === "user" || type === "all") {
        const res = await fetch(
          `/api/search/users?q=${encodeURIComponent(query)}&limit=${limit}`,
        );
        if (res.ok) {
          const data = await res.json();
          const userItems: AutocompleteItem[] = (data.hits || []).map(
            (u: {
              id: string;
              displayName?: string;
              handle: string;
              avatarKey?: string | null;
              avatarUrl?: string | null;
            }) => ({
              id: u.id,
              type: "user" as const,
              title: u.displayName || u.handle,
              subtitle: `@${u.handle}`,
              avatarKey: u.avatarKey ?? undefined,
              avatarUrl: u.avatarUrl ?? undefined,
            }),
          );
          setItems((prev) => [...prev, ...userItems]);
        }
      }

      if (type === "topic" || type === "all") {
        // Search topics
        const res = await fetch(
          `/api/search/topics?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          const topicItems: AutocompleteItem[] = (data.hits || []).map(
            (t: { id: string; title: string; slug: string }) => ({
              id: t.id,
              type: "topic" as const,
              title: t.title,
              slug: t.slug,
            }),
          );
          setItems((prev) => (type === "all" ? [...prev, ...topicItems] : topicItems));
        }
      }

      if (type === "post" || type === "all") {
        const res = await fetch(
          `/api/search/posts?q=${encodeURIComponent(query)}&limit=${limit}`,
        );
        if (res.ok) {
          const data = await res.json();
          const postItems: AutocompleteItem[] = (data.hits || []).map(
            (p: {
              id: string;
              title?: string;
              body: string;
              author?: { displayName: string };
              headerImageKey?: string | null;
              headerImageUrl?: string | null;
            }) => ({
              id: p.id,
              type: "post" as const,
              title: p.title || p.body.substring(0, 50),
              subtitle: p.author?.displayName,
              headerImageKey: p.headerImageKey ?? undefined,
              headerImageUrl: p.headerImageUrl ?? undefined,
            }),
          );
          setItems((prev) => (type === "all" ? [...prev, ...postItems] : postItems));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const showPlaceholder = query.trim().length < 2 || (items.length === 0 && !loading);

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-80 max-h-96 overflow-y-auto bg-ink border border-divider rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {showPlaceholder ? (
        <div className="p-4 text-center text-tertiary text-sm">
          {t("startTypingToSeeSuggestions")}
        </div>
      ) : loading ? (
        <div className="p-4 text-center text-secondary text-sm">Loading...</div>
      ) : (
        <div className="py-2">
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0 overflow-hidden">
                  {item.type === "user" && (
                    <Avatar
                      size="sm"
                      avatarKey={item.avatarKey}
                      avatarUrl={item.avatarUrl}
                      displayName={item.title}
                      handle={item.subtitle?.replace(/^@/, "")}
                      className="!h-8 !w-8"
                    />
                  )}
                  {item.type === "topic" && "#"}
                  {item.type === "post" &&
                    (item.headerImageKey || item.headerImageUrl ? (
                      <img
                        src={
                          item.headerImageKey
                            ? getImageUrl(item.headerImageKey)
                            : item.headerImageUrl ?? ""
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "📄"
                    ))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-paper truncate">
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div className="text-xs text-tertiary truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
