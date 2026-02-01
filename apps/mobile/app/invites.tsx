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
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT } from '../constants/theme';
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
        title: t('invites.referralShareTitle', 'Join me on Citewalk'),
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
                {t('invites.heroText', 'Enter your friend\'s email. We\'ll send them a one-time invitation code. You can invite up to 3 people.')}
              </Text>
            </View>

            {/* Invites remaining: compact row, then send form */}
            <View style={styles.remainingRow}>
              <MaterialIcons name="mail-outline" size={20} color={COLORS.tertiary} style={styles.remainingIcon} />
              <Text style={styles.remainingLabel}>
                {t('invites.remainingLabel', 'Invites remaining')}
              </Text>
              <Text style={styles.remainingCount}>
                {loading ? '…' : String(data?.remaining ?? 0)}
              </Text>
            </View>

            <View style={styles.sendCard}>
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
          <>
            <View style={styles.hero}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="share" size={HEADER.iconSize} color={COLORS.primary} />
              </View>
              <Text style={styles.heroTitle}>{t('invites.referralTitle', 'Refer Friends')}</Text>
              <Text style={styles.heroText}>
                {t('invites.referralText', 'Share your referral link with friends. They can join Citewalk and you\'ll be connected.')}
              </Text>
            </View>
            <View style={styles.referralCard}>
              <Pressable
                style={[styles.button, referralLoading && styles.buttonDisabled]}
                onPress={handleShareReferralLink}
                disabled={referralLoading}
              >
                {referralLoading ? (
                  <ActivityIndicator size="small" color={COLORS.ink} />
                ) : (
                  <View style={styles.buttonContent}>
                    <MaterialIcons name="share" size={22} color={COLORS.ink} />
                    <Text style={styles.buttonText}>{t('invites.shareReferralLink', 'Share referral link')}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </>
        )}

        {betaMode && data?.invites && data.invites.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.listTitle}>{t('invites.sentInvites', 'Sent invitations')}</Text>
            <View style={styles.inviteList}>
              {data.invites.map((inv) => (
                <View key={inv.code} style={styles.inviteCard}>
                  <View style={styles.inviteCardMain}>
                    <View style={styles.inviteIconWrap}>
                      <MaterialIcons name="mail-outline" size={18} color={COLORS.primary} />
                    </View>
                    <View style={styles.inviteCardText}>
                      <Text style={styles.inviteEmail} numberOfLines={1} selectable>
                        {inv.email || t('invites.noEmail', 'No email')}
                      </Text>
                      <Text style={styles.inviteMeta}>
                        {t('invites.sent', 'Sent')} {formatDate(inv.sentAt)}
                        {inv.expiresAt ? ` · ${t('invites.expires', 'Expires')} ${formatDate(inv.expiresAt)}` : ''}
                      </Text>
                      {inv.status === 'PENDING' && (
                        <View style={styles.inviteActionsInline}>
                          <Pressable
                            style={styles.inviteActionLink}
                            onPress={() => handleResend(inv.code)}
                            disabled={resendingCode === inv.code}
                          >
                            {resendingCode === inv.code ? (
                              <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                              <Text style={styles.inviteActionLinkText}>{t('invites.resend', 'Resend')}</Text>
                            )}
                          </Pressable>
                          <Text style={styles.inviteActionDot}>·</Text>
                          <Pressable
                            style={styles.inviteActionLink}
                            onPress={() => handleRevoke(inv.code)}
                            disabled={revokingCode === inv.code}
                          >
                            {revokingCode === inv.code ? (
                              <ActivityIndicator size="small" color={COLORS.error} />
                            ) : (
                              <Text style={styles.inviteActionLinkRevoke}>{t('invites.revoke', 'Revoke')}</Text>
                            )}
                          </Pressable>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusPill, inv.status === 'PENDING' && styles.statusPillPending, inv.status === 'ACTIVATED' && styles.statusPillActivated, inv.status === 'EXPIRED' && styles.statusPillExpired, inv.status === 'REVOKED' && styles.statusPillRevoked]}>
                      <Text style={[styles.statusPillText, inv.status === 'PENDING' && styles.statusPillTextPending, inv.status === 'ACTIVATED' && styles.statusPillTextActivated]}>{statusLabel(inv.status)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
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
  content: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: LAYOUT.contentPaddingVertical,
    paddingBottom: 80,
  },
  hero: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  heroText: {
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.s,
    fontFamily: FONTS.regular,
  },
  /* Invites remaining: single compact row */
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  remainingIcon: { marginRight: SPACING.s },
  remainingLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  remainingCount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  /* Send form card */
  sendCard: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xl,
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
    borderRadius: SIZES.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  referralCard: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: SPACING.xl,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  /* Sent invitations list – compact cards */
  list: { marginTop: SPACING.l },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  inviteList: { gap: SPACING.s },
  inviteCard: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  inviteCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inviteIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  inviteCardText: {
    flex: 1,
    minWidth: 0,
  },
  inviteEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  inviteMeta: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  inviteActionsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  inviteActionLink: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    minHeight: 24,
    justifyContent: 'center',
  },
  inviteActionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  inviteActionLinkRevoke: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
    fontFamily: FONTS.semiBold,
  },
  inviteActionDot: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  statusPill: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: COLORS.divider,
    marginLeft: SPACING.s,
  },
  statusPillPending: {
    backgroundColor: 'rgba(110, 122, 138, 0.3)',
  },
  statusPillActivated: {
    backgroundColor: 'rgba(110, 122, 138, 0.25)',
  },
  statusPillExpired: {
    backgroundColor: COLORS.hover,
  },
  statusPillRevoked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  statusPillTextPending: { color: COLORS.primary },
  statusPillTextActivated: { color: COLORS.secondary },
});
