import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ConfirmModal';

type InviteStatus = 'PENDING' | 'ACTIVATED' | 'EXPIRED' | 'REVOKED';

interface InviteItem {
  code: string;
  email: string | null;
  status: InviteStatus;
  sentAt: string;
  expiresAt: string | null;
  lastSentAt: string | null;
}

export default function InvitesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showError, showSuccess } = useToast();
  const [data, setData] = useState<{ invites: InviteItem[]; remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [resendingCode, setResendingCode] = useState<string | null>(null);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);
  const [revokeModalCode, setRevokeModalCode] = useState<string | null>(null);
  const [betaMode, setBetaMode] = useState<boolean>(true);
  const [referralLoading, setReferralLoading] = useState(false);

  const fetchBetaMode = async () => {
    try {
      const res = await api.get<{ betaMode: boolean }>('/invites/beta-mode');
      setBetaMode(res.betaMode);
    } catch {
      setBetaMode(true);
    }
  };

  const fetchInvites = async () => {
    try {
      await fetchBetaMode();
      const res = await api.get<{ invites: InviteItem[]; remaining: number }>('/invites/my');
      setData(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleShareReferralLink = async () => {
    setReferralLoading(true);
    try {
      const { referralLink } = await api.get<{ referralLink: string; referralId: string }>('/invites/referral-link');
      await Share.share({
        message: referralLink,
        url: Platform.OS === 'ios' ? referralLink : undefined,
        title: t('invites.referralShareTitle', 'Join me on Cite'),
      });
    } catch (error: any) {
      showError(error?.message || t('invites.referralFailed', 'Could not get referral link'));
    } finally {
      setReferralLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSending(true);
    try {
      await api.post('/invites/send', { email: trimmed });
      setEmail('');
      await fetchInvites();
    } catch (error: any) {
      const msg = error?.message || error?.data?.message || t('invites.sendFailed', 'Failed to send invitation');
      showError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (code: string) => {
    setResendingCode(code);
    try {
      await api.post(`/invites/${code}/resend`, {});
      await fetchInvites();
    } catch (error: any) {
      const msg = error?.message || error?.data?.message || t('invites.resendFailed', 'Could not resend. Try again later.');
      showError(msg);
    } finally {
      setResendingCode(null);
    }
  };

  const handleRevoke = (code: string) => {
    setRevokeModalCode(code);
  };

  const confirmRevoke = async () => {
    if (!revokeModalCode) return;
    setRevokingCode(revokeModalCode);
    try {
      await api.post(`/invites/${revokeModalCode}/revoke`, {});
      await fetchInvites();
      showSuccess(t('invites.revoked', 'Invitation revoked'));
    } catch (error: any) {
      showError(error?.message || t('invites.revokeFailed', 'Failed to revoke'));
      throw error; // So ConfirmModal doesn't close
    } finally {
      setRevokingCode(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const statusLabel = (status: InviteStatus) => {
    switch (status) {
      case 'PENDING': return t('invites.statusPending', 'Pending');
      case 'ACTIVATED': return t('invites.statusActivated', 'Activated');
      case 'EXPIRED': return t('invites.statusExpired', 'Expired');
      case 'REVOKED': return t('invites.statusRevoked', 'Revoked');
      default: return status;
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('invites.title', 'Invite Friends')} paddingTop={insets.top} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchInvites();
            }}
            tintColor={COLORS.primary}
          />
        }
      >
        {betaMode ? (
          <>
            <View style={styles.hero}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="person-add" size={HEADER.iconSize} color={COLORS.primary} />
              </View>
              <Text style={styles.heroTitle}>{t('invites.heroTitle', 'Invite by email')}</Text>
              <Text style={styles.heroText}>
                {t('invites.heroText', 'Enter your friend\'s email. We\'ll send them a one-time invitation code. You have a limited number of invites.')}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>{t('invites.remaining', 'INVITES REMAINING')}</Text>
              <Text style={styles.count}>{loading ? '...' : data?.remaining ?? 0}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('invites.emailPlaceholder', 'Friend\'s email address')}
                placeholderTextColor={COLORS.tertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!sending}
              />
              <Pressable
                style={[styles.button, (sending || !email.trim() || (data && data.remaining <= 0)) && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={sending || !email.trim() || (data != null && data.remaining <= 0)}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={COLORS.ink} />
                ) : (
                  <Text style={styles.buttonText}>{t('invites.sendInvite', 'Send invitation')}</Text>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="share" size={HEADER.iconSize} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>{t('invites.referralTitle', 'Refer Friends')}</Text>
            <Text style={styles.heroText}>
              {t('invites.referralText', 'Share your referral link with friends. They can join Cite and you\'ll be connected.')}
            </Text>
            <Pressable
              style={[styles.button, styles.referralButton, referralLoading && styles.buttonDisabled]}
              onPress={handleShareReferralLink}
              disabled={referralLoading}
            >
              {referralLoading ? (
                <ActivityIndicator size="small" color={COLORS.ink} />
              ) : (
                <>
                  <MaterialIcons name="share" size={HEADER.iconSize} color={COLORS.ink} style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>{t('invites.createReferralLink', 'Create Referral Link')}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {betaMode && data?.invites && data.invites.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.listTitle}>{t('invites.sentInvites', 'Sent invitations')}</Text>
            {data.invites.map((inv) => (
              <View key={inv.code} style={styles.inviteCard}>
                <View style={styles.inviteCardHeader}>
                  <View style={styles.inviteEmailRow}>
                    <MaterialIcons name="email" size={HEADER.iconSize} color={COLORS.primary} style={styles.inviteEmailIcon} />
                    <Text style={styles.inviteEmail} numberOfLines={1} selectable>
                      {inv.email || t('invites.noEmail', 'No email')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, inv.status === 'PENDING' && styles.statusBadgePending, inv.status === 'ACTIVATED' && styles.statusBadgeActivated]}>
                    <Text style={[styles.statusBadgeText, inv.status === 'PENDING' && styles.statusBadgeTextPending]}>
                      {statusLabel(inv.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.inviteMeta}>
                  {t('invites.sent', 'Sent')} {formatDate(inv.sentAt)}
                  {inv.expiresAt ? ` · ${t('invites.expires', 'Expires')} ${formatDate(inv.expiresAt)}` : ''}
                </Text>
                {inv.status === 'PENDING' && (
                  <View style={styles.inviteActions}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => handleResend(inv.code)}
                      disabled={resendingCode === inv.code}
                    >
                      {resendingCode === inv.code ? (
                        <ActivityIndicator size="small" color={COLORS.paper} />
                      ) : (
                        <>
                          <MaterialIcons name="refresh" size={HEADER.iconSize} color={COLORS.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnText}>{t('invites.resend', 'Resend')}</Text>
                        </>
                      )}
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnRevoke]}
                      onPress={() => handleRevoke(inv.code)}
                      disabled={revokingCode === inv.code}
                    >
                      {revokingCode === inv.code ? (
                        <ActivityIndicator size="small" color={COLORS.error} />
                      ) : (
                        <>
                          <MaterialIcons name="block" size={HEADER.iconSize} color={COLORS.error} style={{ marginRight: 6 }} />
                          <Text style={styles.actionBtnTextRevoke}>{t('invites.revoke', 'Revoke')}</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!revokeModalCode}
        title={t('invites.revokeTitle', 'Revoke invitation')}
        message={t('invites.revokeConfirm', 'This will invalidate the code immediately. The person will no longer be able to use it.')}
        confirmLabel={t('invites.revoke', 'Revoke')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeModalCode(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: { padding: SPACING.l, paddingBottom: 80 },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.s,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.hover,
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
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  input: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  button: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  referralButton: {
    flexDirection: 'row',
    marginTop: SPACING.m,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  list: { gap: SPACING.l },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  inviteCard: {
    backgroundColor: COLORS.ink,
    padding: SPACING.l,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  inviteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  inviteEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  inviteEmailIcon: { marginRight: SPACING.s },
  inviteEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.hover,
  },
  statusBadgePending: { backgroundColor: 'rgba(110, 122, 138, 0.25)' },
  statusBadgeActivated: { backgroundColor: 'rgba(110, 122, 138, 0.2)' },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.tertiary, fontFamily: FONTS.semiBold },
  statusBadgeTextPending: { color: COLORS.primary },
  inviteMeta: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.s,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, fontFamily: FONTS.semiBold },
  actionBtnRevoke: { backgroundColor: 'transparent' },
  actionBtnTextRevoke: { fontSize: 14, fontWeight: '600', color: COLORS.error, fontFamily: FONTS.semiBold },
});
