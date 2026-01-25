import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';

export default function InvitesScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<{ codes: any[], remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const res = await api.get('/invites/my');
      setStatus(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/invites/generate');
      fetchInvites();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async (code: string) => {
    const url = `https://cite.app/sign-in?code=${code}`;
    try {
      await Share.share({
        message: `Join me on CITE. Use my invite code: ${code}\n\n${url}`,
        url: url, // iOS
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvites(); }} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="people-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Build the Network</Text>
          <Text style={styles.heroText}>
            CITE is built on trust. Invite people whose writing and thinking you value.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>INVITES REMAINING</Text>
          <Text style={styles.count}>{loading ? '...' : status?.remaining}</Text>
          
          <Pressable
            style={[styles.button, (!status || status.remaining <= 0 || generating) && styles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={!status || status.remaining <= 0 || generating}
          >
            <Text style={styles.buttonText}>
              {generating ? 'Generating...' : 'Generate New Code'}
            </Text>
          </Pressable>
        </View>

        {status?.codes && status.codes.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.listTitle}>ACTIVE CODES</Text>
            {status.codes.map((invite) => (
              <View key={invite.code} style={styles.codeItem}>
                <Text style={styles.codeText}>{invite.code}</Text>
                <Pressable
                  style={styles.shareButton}
                  onPress={() => handleShare(invite.code)}
                >
                  <Text style={styles.shareText}>Share</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 60,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  content: {
    padding: SPACING.l,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.l,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  heroText: {
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  card: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xl,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 1,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  count: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.l,
    fontFamily: FONTS.semiBold,
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  list: {
    gap: SPACING.m,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginLeft: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  codeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.hover,
    padding: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  codeText: {
    fontSize: 18,
    color: COLORS.paper,
    fontFamily: 'Menlo', // Monospace if available
    letterSpacing: 2,
  },
  shareButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
});
