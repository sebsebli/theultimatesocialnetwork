import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);

  // Debounced handle check
  useEffect(() => {
    if (!handle || handle.length < 3 || !isValidHandle(handle)) {
      setHandleAvailable(null);
      return;
    }

    const checkHandle = async () => {
      setCheckingHandle(true);
      try {
        const res = await api.get<{ available: boolean }>(`/users/check-handle?handle=${handle}`);
        setHandleAvailable(res.available);
      } catch (error) {
        console.error('Handle check failed', error);
      } finally {
        setCheckingHandle(false);
      }
    };

    const timer = setTimeout(checkHandle, 500);
    return () => clearTimeout(timer);
  }, [handle]);
  const [bio, setBio] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidHandle = (handle: string) => {
    // Handle should be lowercase alphanumeric and underscores, 3-30 chars
    const handleRegex = /^[a-z0-9_]{3,30}$/;
    return handleRegex.test(handle);
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      Alert.alert(t('common.error'), t('onboarding.profile.displayNameRequired') || 'Display name is required');
      return;
    }

    if (!handle.trim()) {
      Alert.alert(t('common.error'), t('onboarding.profile.handleRequired') || 'Handle is required');
      return;
    }

    if (!isValidHandle(handle.toLowerCase())) {
      Alert.alert(t('common.error'), t('onboarding.profile.handleInvalid') || 'Handle must be 3-30 characters, lowercase letters, numbers, and underscores only');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/me', {
        displayName: displayName.trim(),
        handle: handle.toLowerCase().trim(),
        bio: bio.trim(),
        isProtected,
      });
      router.push('/onboarding/languages');
    } catch (error: any) {
      console.error('Failed to update profile', error);
      const errorMessage = error?.status === 409
        ? t('onboarding.profile.handleTaken') || 'This handle is already taken'
        : t('onboarding.profile.updateFailed') || 'Failed to update profile';
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, { marginTop: insets.top + 20 }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
          </Pressable>
          <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('onboarding.profile.displayName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('onboarding.profile.displayName')}
              placeholderTextColor={COLORS.tertiary}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('onboarding.profile.handle')}</Text>
              {checkingHandle ? (
                <ActivityIndicator size="small" color={COLORS.tertiary} />
              ) : handleAvailable === true ? (
                <Text style={[styles.statusText, { color: '#4ADE80' }]}>Available</Text>
              ) : handleAvailable === false ? (
                <Text style={[styles.statusText, { color: COLORS.error }]}>Taken</Text>
              ) : null}
            </View>
            <TextInput
              style={[
                styles.input,
                handleAvailable === false && { borderBottomColor: COLORS.error }
              ]}
              placeholder={t('onboarding.profile.handle')}
              placeholderTextColor={COLORS.tertiary}
              value={handle}
              onChangeText={(text: string) => setHandle(text.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('onboarding.profile.bio')}</Text>
              <Text style={styles.charCount}>{bio.length}/160</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('onboarding.profile.bioPlaceholder')}
              placeholderTextColor={COLORS.tertiary}
              value={bio}
              onChangeText={(text: string) => {
                if (text.length <= 160) setBio(text);
              }}
              multiline
              numberOfLines={3}
              maxLength={160}
            />
          </View>

          <View style={styles.privacySection}>
            <Text style={styles.privacyTitle}>{t('onboarding.profile.privacy')}</Text>
            <View style={styles.privacyToggle}>
              <Pressable
                style={[styles.toggleOption, !isProtected && styles.toggleOptionActive]}
                onPress={() => setIsProtected(false)}
                accessibilityRole="button"
                accessibilityState={{ selected: !isProtected }}
              >
                <Text style={[styles.toggleText, !isProtected && styles.toggleTextActive]}>
                  {t('onboarding.profile.open')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleOption, isProtected && styles.toggleOptionActive]}
                onPress={() => setIsProtected(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: isProtected }}
              >
                <Text style={[styles.toggleText, isProtected && styles.toggleTextActive]}>
                  {t('onboarding.profile.protected')}
                </Text>
              </Pressable>
            </View>
            {isProtected && (
              <View style={styles.protectedDescContainer}>
                <MaterialIcons name="lock" size={14} color={COLORS.secondary} />
                <Text style={styles.privacyDescription}>
                  {t('onboarding.profile.protectedDesc')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, (!displayName || !handle || loading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!displayName || !handle || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t('common.loading') : t('common.continue')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.l,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  backButton: {
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  form: {
    gap: SPACING.l,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  charCount: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  input: {
    height: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingHorizontal: 0,
    paddingVertical: SPACING.m,
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SPACING.m,
    textAlignVertical: 'top',
  },
  privacySection: {
    marginTop: SPACING.s,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.secondary,
    marginBottom: SPACING.m,
    fontFamily: FONTS.medium,
  },
  privacyToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: 2,
    marginBottom: SPACING.m,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: SPACING.s,
    borderRadius: SIZES.borderRadius - 2,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: COLORS.ink,
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  toggleTextActive: {
    color: COLORS.paper,
  },
  protectedDescContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  privacyDescription: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
    fontFamily: FONTS.regular,
  },
  footer: {
    marginTop: SPACING.xxxl,
    paddingBottom: SPACING.l,
  },
  button: {
    height: 50,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
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
});