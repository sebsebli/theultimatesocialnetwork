import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
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
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'topics'>(initialTab);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === 'followers') {
        data = await api.get('/users/me/followers');
      } else if (activeTab === 'following') {
        data = await api.get('/users/me/following');
      } else {
        data = await api.get('/topics/me/following');
      }
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item: any) => {
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
             <Pressable style={styles.removeBtn} onPress={() => handleAction(item)}>
                <MaterialIcons name="close" size={20} color={COLORS.secondary} />
             </Pressable>
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
             <Pressable style={styles.removeBtn} onPress={() => handleAction(item)}>
                <MaterialIcons name="close" size={20} color={COLORS.secondary} />
             </Pressable>
          </View>
        );
    }
  };

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

       {loading ? (
         <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
       ) : (
         <FlatList
           data={items}
           renderItem={renderItem}
           keyExtractor={(item) => item.id}
           contentContainerStyle={{ paddingBottom: SPACING.l }}
           ListEmptyComponent={
             <View style={styles.emptyState}>
               <Text style={styles.emptyText}>{t('common.noResults', 'Nothing here.')}</Text>
             </View>
           }
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
});