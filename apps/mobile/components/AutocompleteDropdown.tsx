import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

interface AutocompleteItem {
  id: string;
  type: 'topic' | 'post' | 'user';
  title: string;
  subtitle?: string;
  slug?: string;
}

interface AutocompleteDropdownProps {
  query: string;
  type: 'topic' | 'post' | 'user' | 'all';
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
        let results: any[] = [];
        
        if (type === 'user' || type === 'all') {
          // User search
          const res = await api.get<{ hits: any[] }>(`/search/users?q=${query}`);
          const users = (res.hits || []).map((u: any) => ({
            id: u.id,
            title: u.handle,
            subtitle: u.displayName,
            type: 'user',
          }));
          results = [...results, ...users];
        }

        if (type === 'topic' || type === 'all') {
          // Topic search (mock for now, or use generic search)
          results.push({ id: `new-topic-${query}`, title: query, type: 'topic', subtitle: 'Create topic' });
        }

        if (type === 'post' || type === 'all') {
          // Post search
          const res = await api.get<{ hits: any[] }>(`/search/posts?q=${query}`);
          const posts = (res.hits || []).map((p: any) => ({
            id: p.id,
            title: p.title || 'Untitled',
            subtitle: p.body.substring(0, 50),
            type: 'post',
          }));
          results = [...results, ...posts];
        }

        setItems(results);
      } catch (error) {
        console.error('Search failed', error);
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
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <View style={styles.itemIcon}>
                {item.type === 'user' ? (
                  <MaterialIcons name="person" size={16} color={COLORS.primary} />
                ) : item.type === 'topic' ? (
                  <MaterialIcons name="tag" size={16} color={COLORS.primary} />
                ) : (
                  <MaterialIcons name="description" size={16} color={COLORS.primary} />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loading: {
    padding: SPACING.l,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
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