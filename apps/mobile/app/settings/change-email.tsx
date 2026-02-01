import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, FONTS, HEADER, LAYOUT, createStyles } from '../../constants/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();

  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    api
      .get<{ email?: string }>('/users/me')
      .then((user) => {
        if (user?.email) setCurrentEmail(user.email);
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false));
  }, []);

  const handleSave = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      showError(t('settings.invalidEmail'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      showError(t('settings.invalidEmail'));
      return;
    }
    if (trimmed === currentEmail.toLowerCase()) {
      showError(t('settings.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      await api.patch('/users/me', { email: trimmed });
      showSuccess(t('settings.emailUpdated'));
      router.back();
    } catch (e: any) {
      const msg = e?.message ?? '';
      showError(
        msg && msg.toLowerCase().includes('already in use')
          ? t('settings.emailInUse')
          : t('settings.updateFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    newEmail.trim().length > 0 &&
    EMAIL_REGEX.test(newEmail.trim().toLowerCase()) &&
    newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();

  if (loadingUser) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScreenHeader
        title={t('settings.changeEmail')}
        paddingTop={insets.top}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {currentEmail ? (
          <View style={styles.field}>
            <Text style={styles.label}>{t('settings.currentEmail')}</Text>
            <Text style={styles.currentEmailText}>{currentEmail}</Text>
          </View>
        ) : null}
        <View style={styles.field}>
          <Text style={styles.label}>{t('settings.newEmail')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('settings.newEmailPlaceholder')}
            placeholderTextColor={COLORS.tertiary}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
        <Pressable
          style={[styles.saveBtn, (!isValid || loading) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.ink} />
          ) : (
            <Text style={styles.saveBtnText}>{t('settings.saveEmail')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.l,
  },
  field: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.tertiary,
    marginBottom: SPACING.xs,
  },
  currentEmailText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.paper,
  },
  input: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
  },
  saveBtn: {
    marginTop: SPACING.m,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.ink,
  },
});
