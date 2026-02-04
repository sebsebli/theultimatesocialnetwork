import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS, createStyles } from '../../constants/theme';
import QRCode from 'react-native-qrcode-svg';

type Session = {
  id: string;
  deviceInfo: string | null;
  lastActiveAt: string;
  createdAt: string;
};

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // 2FA State
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await api.get<Session[]>('/sessions');
      setSessions(data);
    } catch {
      // ignore
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showSuccess(t('security.sessionRevoked', 'Session revoked'));
    } catch {
      showError(t('security.revokeFailed', 'Failed to revoke session'));
    }
  };

  const handleRevokeAll = () => {
    Alert.alert(
      t('security.revokeAllTitle', 'Revoke all sessions?'),
      t('security.revokeAllConfirm', 'This will log you out of all devices.'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.revokeAll', 'Revoke all'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/sessions');
              setSessions([]);
              showSuccess(t('security.allRevoked', 'All sessions revoked'));
              router.replace('/'); // Force logout
            } catch {
              showError(t('security.revokeFailed', 'Failed to revoke sessions'));
            }
          },
        },
      ]
    );
  };

  const start2FASetup = async () => {
    try {
      const data = await api.post<{ otpauthUrl?: string; secret?: string }>('/auth/2fa/setup');
      const url = data?.otpauthUrl ?? (data as any)?.otpauth_url;
      const sec = data?.secret ?? (data as any)?.secret;
      if (!url || !sec) {
        showError(t('security.2faSetupFailed', 'Could not start 2FA setup. Try again.'));
        return;
      }
      setQrValue(url);
      setSecret(sec);
      setIs2FASetupOpen(true);
    } catch (e: any) {
      const msg = e?.message ?? t('common.error', 'Network error');
      showError(msg);
    }
  };

  const confirm2FA = async () => {
    if (!secret || !totpCode) return;
    setVerifyLoading(true);
    try {
      await api.post('/auth/2fa/confirm', {
        token: String(totpCode).trim(),
        secret: String(secret).trim(),
      });
      showSuccess(t('security.2faEnabled', '2FA Enabled Successfully'));
      setIs2FASetupOpen(false);
      setQrValue(null);
      setSecret(null);
      setTotpCode('');
    } catch (e: any) {
      const msg = e?.message ?? t('security.invalidCode', 'Invalid code. Try again.');
      showError(msg);
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('security.title', 'Security')} titleIcon="security" paddingTop={insets.top} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* 2FA Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security.2faTitle', 'Two-Factor Authentication')}</Text>
          <View style={styles.card}>
            <Text style={styles.description}>
              {t('security.2faDesc', 'Secure your account with an authenticator app.')}
            </Text>

            {!is2FASetupOpen ? (
              <Pressable style={styles.button} onPress={start2FASetup}>
                <Text style={styles.buttonText}>{t('security.enable2fa', 'Enable 2FA')}</Text>
              </Pressable>
            ) : (
              <View style={styles.setupContainer}>
                {qrValue && (
                  <View style={styles.qrContainer}>
                    <QRCode value={qrValue} size={150} />
                  </View>
                )}
                <Text style={styles.secretText}>{t('security.secret', 'Secret')}: {secret}</Text>

                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={COLORS.tertiary}
                  value={totpCode}
                  onChangeText={(val: string) => setTotpCode(val.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                />

                <Pressable
                  style={[styles.button, (!totpCode || verifyLoading) && styles.buttonDisabled]}
                  onPress={confirm2FA}
                  disabled={verifyLoading || totpCode.length !== 6}
                >
                  <Text style={styles.buttonText}>
                    {verifyLoading ? t('common.verifying', 'Verifying...') : t('common.verify', 'Verify')}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Sessions Section */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t('security.sessionsTitle', 'Active Sessions')}</Text>
            <Pressable onPress={handleRevokeAll}>
              <Text style={styles.revokeAllText}>{t('security.revokeAll', 'Revoke all')}</Text>
            </Pressable>
          </View>

          <View style={styles.sessionsList}>
            {loadingSessions ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : sessions.length === 0 ? (
              <Text style={styles.emptyText}>{t('security.noSessions', 'No active sessions found.')}</Text>
            ) : (
              sessions.map((session) => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceInfo}>{session.deviceInfo || t('security.unknownDevice', 'Unknown device')}</Text>
                    <Text style={styles.sessionMeta}>
                      {new Date(session.lastActiveAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRevoke(session.id)} style={styles.revokeButton}>
                    <MaterialIcons name="close" size={20} color={COLORS.secondary} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    padding: SPACING.l,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  card: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  description: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: SPACING.l,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.ink,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  setupContainer: {
    alignItems: 'center',
    gap: SPACING.m,
  },
  qrContainer: {
    padding: SPACING.m,
    backgroundColor: '#FFF',
    borderRadius: SIZES.borderRadius,
  },
  secretText: {
    color: COLORS.tertiary,
    fontSize: 12,
    fontFamily: FONTS.mono,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    color: COLORS.paper,
    fontSize: 20,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    letterSpacing: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  revokeAllText: {
    color: COLORS.error,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  sessionsList: {
    gap: SPACING.s,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  deviceInfo: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  sessionMeta: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  revokeButton: {
    padding: SPACING.s,
  },
  emptyText: {
    color: COLORS.tertiary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
