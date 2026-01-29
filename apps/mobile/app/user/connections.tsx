import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONTS, SIZES } from '../../constants/theme';
import { api } from '../../utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopicCard, PersonCard } from '../../components/ExploreCards';

export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const initialTab = params.tab as 'followers' | 'following' | 'topics' || 'following';
  const handle = params.handle as string | undefined;
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'topics'>(initialTab);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab, handle]);

  const loadData = async () => {
    setLoading(true);
    setIsPrivate(false);
    setSuggestions([]);
    try {
      let data;
      const baseUrl = handle ? `/users/${handle}` : '/users/me';
      
      if (activeTab === 'followers') {
        data = await api.get(`${baseUrl}/followers`);
      } else if (activeTab === 'following') {
        data = await api.get(`${baseUrl}/following`);
      } else {
        if (handle) {
             try {
                data = await api.get(`${baseUrl}/topics`);
             } catch {
                data = [];
             }
        } else {
            data = await api.get('/topics/me/following');
        }
      }
      
      const itemList = data || [];
      setItems(itemList);

      // Load suggestions if empty and viewing self
      if (itemList.length === 0 && !handle) {
        if (activeTab === 'topics') {
            const res = await api.get('/explore/topics?limit=4');
            setSuggestions(Array.isArray(res) ? res : (res.items || []));
        } else {
            const res = await api.get('/users/suggested?limit=4');
            setSuggestions(Array.isArray(res) ? res : []);
        }
      }

    } catch (e: any) {
      if (e?.status === 403) {
        setIsPrivate(true);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: any) => {
    if (handle) return; // Cannot modify others' lists
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
        if (activeTab === 'followers') {
            // Remove follower
            await api.delete(`/users/me/followers/${item.id}`);
        } else if (activeTab === 'following') {
            // Unfollow user
            await api.delete(`/users/${item.id}/follow`);
        } else if (activeTab === 'topics') {
            // Unfollow topic
            await api.delete(`/topics/${item.slug}/follow`);
        }
        // Remove from list
        setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (error) {
        Alert.alert(t('common.error'), t('common.actionFailed'));
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
        const title = item.displayName || item.title || item.handle || '';
        return title.toLowerCase().includes(q);
    });
  }, [items, searchQuery]);

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'topics') {
        return (
          <View style={styles.itemWrapper}>
             <View style={{ flex: 1 }}>
                <TopicCard 
                    item={{...item, isFollowing: true}} 
                    onPress={() => router.push(`/topic/${item.slug || item.id}`)}
                    showWhy={false}
                />
             </View>
             {!handle && (
                 <Pressable style={styles.removeBtn} onPress={() => handleAction(item)}>
                    <MaterialIcons name="close" size={20} color={COLORS.secondary} />
                 </Pressable>
             )}
          </View>
        );
    } else {
        return (
          <View style={styles.itemWrapper}>
             <View style={{ flex: 1 }}>
                <PersonCard 
                    item={item} 
                    onPress={() => router.push(`/user/${item.handle}`)} 
                    showWhy={false}
                />
             </View>
             {!handle && (
                 <Pressable style={styles.removeBtn} onPress={() => handleAction(item)}>
                    <MaterialIcons name="close" size={20} color={COLORS.secondary} />
                 </Pressable>
             )}
          </View>
        );
    }
  };

  const EmptyComponent = () => (
    <View style={styles.emptyState}>
       <Text style={styles.emptyText}>{t('common.noResults', 'Nothing here.')}</Text>
       
       {suggestions.length > 0 && (
         <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsHeader}>{t('home.suggestedPeople', 'Suggested for you')}</Text>
            {suggestions.map(item => (
                <View key={item.id} style={styles.suggestionItem}>
                    {activeTab === 'topics' ? (
                        <TopicCard 
                            item={item} 
                            onPress={() => router.push(`/topic/${item.slug || item.id}`)}
                            showWhy={false}
                        />
                    ) : (
                        <PersonCard 
                            item={item} 
                            onPress={() => router.push(`/user/${item.handle}`)} 
                            showWhy={false}
                        />
                    )}
                </View>
            ))}
         </View>
       )}
    </View>
  );

  if (isPrivate) {
      return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
           <View style={styles.header}>
             <Pressable onPress={() => router.back()} style={styles.backButton}>
               <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
             </Pressable>
             <Text style={styles.title}>{t('profile.connections')}</Text>
             <View style={{ width: 24 }} />
           </View>
           <View style={styles.privateState}>
                <MaterialIcons name="lock" size={48} color={COLORS.secondary} />
                <Text style={styles.privateText}>This account is private</Text>
                <Text style={styles.privateSubText}>Follow this account to see their connections.</Text>
           </View>
        </View>
      );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
       <View style={styles.header}>
         <Pressable onPress={() => router.back()} style={styles.backButton}>
           <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
         </Pressable>
         <Text style={styles.title}>{t('profile.connections', 'Connections')}</Text>
         <View style={{ width: 24 }} />
       </View>

       <View style={styles.tabs}>
         {['followers', 'following', 'topics'].map((tab) => (
             <Pressable 
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab as any);
                }}
             >
               <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                 {t(`profile.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
               </Text>
             </Pressable>
         ))}
       </View>

       <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={COLORS.tertiary} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder={t('common.search', 'Search...')}
                placeholderTextColor={COLORS.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
       </View>

       {loading ? (
         <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
       ) : (
         <FlatList
           data={filteredItems}
           renderItem={renderItem}
           keyExtractor={(item) => item.id}
           contentContainerStyle={{ paddingBottom: SPACING.l }}
           ListEmptyComponent={EmptyComponent}
         />
       )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
  },
  backButton: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.m,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  tabTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.tertiary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.l,
  },
  removeBtn: {
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: 20,
    marginLeft: SPACING.s,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  searchIcon: {
    marginLeft: SPACING.m,
  },
  searchInput: {
    flex: 1,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  privateState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  privateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginTop: SPACING.l,
    fontFamily: FONTS.semiBold,
  },
  privateSubText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: SPACING.s,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  suggestionsContainer: {
    marginTop: SPACING.xxxl,
    width: '100%',
  },
  suggestionsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    marginBottom: SPACING.m,
    textTransform: 'uppercase',
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.5,
  },
  suggestionItem: {
    marginBottom: SPACING.m,
  },
});