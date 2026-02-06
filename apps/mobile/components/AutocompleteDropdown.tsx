import React, { useState, useEffect } from "react";
import { Text, View, FlatList, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../utils/api";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  FLATLIST_DEFAULTS,
} from "../constants/theme";
import { InlineSkeleton } from "./LoadingSkeleton";

interface AutocompleteItem {
  id: string;
  type: "topic" | "post" | "user";
  title: string;
  subtitle?: string;
  slug?: string;
}

interface AutocompleteDropdownProps {
  query: string;
  type: "topic" | "post" | "user" | "all";
  onSelect: (item: AutocompleteItem) => void;
  onClose: () => void;
}

export function AutocompleteDropdown({
  query,
  type,
  onSelect,
  onClose,
}: AutocompleteDropdownProps) {
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setItems([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        let results: Record<string, unknown>[] = [];

        if (type === "user" || type === "all") {
          // User search
          const res = await api.get<{ hits: Record<string, unknown>[] }>(
            `/search/users?q=${query}`,
          );
          const users = (res.hits || []).map((u: Record<string, unknown>) => ({
            id: u.id as string,
            title: u.handle as string,
            subtitle: u.displayName as string | undefined,
            type: "user" as const,
          }));
          results = [...results, ...users];
        }

        if (type === "topic" || type === "all") {
          // Topic search
          const res = await api.get<{ hits: Record<string, unknown>[] }>(
            `/search/topics?q=${query}`,
          );
          // Fallback if topics API is different, but assuming Meilisearch consistency
          const topics = (res.hits || []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            title: (t.title || t.slug || "") as string,
            slug: t.slug as string | undefined,
            subtitle: t.description
              ? (t.description as string).substring(0, 50)
              : undefined,
            type: "topic" as const,
          }));
          results = [...results, ...topics];
        }

        if (type === "post" || type === "all") {
          // Post search
          const res = await api.get<{ hits: Record<string, unknown>[] }>(
            `/search/posts?q=${query}`,
          );
          const posts = (res.hits || []).map((p: Record<string, unknown>) => {
            const author = p.author as { handle?: string; displayName?: string } | undefined;
            const body = p.body as string | undefined;
            return {
              id: p.id as string,
              title: (p.title || (body ? body.substring(0, 40) : "") || "Untitled") as string,
              subtitle: author
                ? `@${author.handle || author.displayName || ""}`
                : body
                  ? body.substring(0, 50)
                  : "",
              type: "post" as const,
            };
          });
          results = [...results, ...posts];
        }

        // Dedupe by type-id (same id can exist as topic vs post)
        const seen = new Set<string>();
        const deduped = (results as unknown as AutocompleteItem[]).filter((r: AutocompleteItem) => {
          const key = `${r.type}-${r.id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setItems(deduped);
      } catch (error) {
        if (__DEV__) console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, type]);

  if (items.length === 0 && !loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loading}>
          <InlineSkeleton />
        </View>
      ) : (
        <FlatList
          data={items}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item: Record<string, unknown>) => `${item.type}-${item.id}`}
          {...FLATLIST_DEFAULTS}
          renderItem={({ item }: { item: AutocompleteItem }) => (
            <Pressable
              style={styles.item}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.type} ${item.title}${item.subtitle ? `, ${item.subtitle}` : ""}`}
            >
              <View style={styles.itemIcon}>
                {item.type === "user" ? (
                  <MaterialIcons
                    name="person"
                    size={HEADER.iconSize}
                    color={COLORS.primary}
                  />
                ) : item.type === "topic" ? (
                  <MaterialIcons
                    name="tag"
                    size={HEADER.iconSize}
                    color={COLORS.primary}
                  />
                ) : (
                  <MaterialIcons
                    name="description"
                    size={HEADER.iconSize}
                    color={COLORS.primary}
                  />
                )}
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = createStyles({
  container: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loading: {
    padding: SPACING.l,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.badge,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.m,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  itemSubtitle: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
});
