import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HANDLE_MIN = 3;
const HANDLE_MAX = 30;
const AVAILABILITY_DEBOUNCE_MS = 400;

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await api.get<any>('/users/me');
        if (user) {
          setDisplayName(user.displayName || '');
          setHandle(user.handle || '');
          setBio(user.bio || '');
          setIsProtected(user.isProtected || false);
          // If handle exists, mark as available/valid so we don't force re-check unless changed
          if (user.handle) {
             setHandleStatus('available'); 
          }
        }
      } catch (e) {
        // Ignore error if new user
      }
    };
    fetchUser();
  }, []);

  const normalizedHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const handleLen = normalizedHandle.length;
  const handleTooShort = handleLen > 0 && handleLen < HANDLE_MIN;
  const handleTooLong = handleLen > HANDLE_MAX;

  const checkAvailability = useCallback(async (h: string) => {
    const norm = h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (norm.length < HANDLE_MIN || norm.length > HANDLE_MAX) {
      setHandleStatus('invalid');
      return;
    }
    setHandleStatus('checking');
    try {
      const res = await api.get<{ available: boolean }>(`/users/handle/available?handle=${encodeURIComponent(norm)}`);
      setHandleStatus(res?.available ? 'available' : 'taken');
    } catch {
      setHandleStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (handleLen === 0) {
      setHandleStatus('idle');
      return;
    }
    if (handleTooShort || handleTooLong) {
      setHandleStatus('invalid');
      return;
    }
    debounceRef.current = setTimeout(() => checkAvailability(handle), AVAILABILITY_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [handle, handleLen, handleTooShort, handleTooLong, checkAvailability]);

  const handleSubmit = async () => {
    if (!displayName.trim() || !handle.trim()) {
      showError(t('onboarding.fieldsRequired'));
      return;
    }
    if (handleTooShort || handleTooLong) {
      showError(t('onboarding.profile.handleInvalid'));
      return;
    }
    if (handleStatus === 'taken') {
      showError(t('onboarding.profile.handleTaken'));
      return;
    }
    if (handleStatus === 'checking' || handleStatus === 'invalid') {
      showError(t('onboarding.profile.handleInvalid'));
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/me', {
        displayName: displayName.trim(),
        handle: normalizedHandle,
        bio: bio.trim(),
        isProtected,
      });
      router.push('/onboarding/starter-packs');
    } catch (error: any) {
      console.error('Failed to update profile', error);
      showError(error?.message || t('onboarding.profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(displayName.trim() && normalizedHandle.length >= HANDLE_MIN && normalizedHandle.length <= HANDLE_MAX && handleStatus === 'available' && !loading);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.secondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.profile.subtitle')}</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('onboarding.profile.displayName')}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Jane Doe"
              placeholderTextColor={COLORS.tertiary}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('onboarding.profile.handle')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputWithPrefix,
                  handleStatus === 'taken' && styles.inputError,
                  handleStatus === 'available' && styles.inputSuccess,
                ]}
                value={handle}
                onChangeText={(text: string) => setHandle(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="janedoe"
                placeholderTextColor={COLORS.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={HANDLE_MAX}
              />
            </View>
            <View style={styles.handleMeta}>
              <Text style={[styles.handleHint, (handleTooShort || handleTooLong) && styles.handleHintError]}>
                {handleLen === 0
                  ? t('onboarding.profile.handleHint')
                  : handleTooShort
                    ? t('onboarding.profile.handleTooShort')
                    : handleTooLong
                      ? t('onboarding.profile.handleTooLong')
                      : t('onboarding.profile.handleHint')}
              </Text>
              <Text style={styles.handleCount}>
                {handleLen}/{HANDLE_MAX}
              </Text>
            </View>
            {handleLen >= HANDLE_MIN && handleLen <= HANDLE_MAX && (
              <View style={styles.availabilityRow}>
                {handleStatus === 'checking' && (
                  <ActivityIndicator size="small" color={COLORS.primary} style={styles.availabilitySpinner} />
                )}
                {handleStatus === 'available' && (
                  <View style={styles.availabilityRow}>
                    <MaterialIcons name="check-circle" size={16} color="#22c55e" style={styles.availabilityIcon} />
                    <Text style={styles.availabilityAvailable}>{t('onboarding.profile.handleAvailable')}</Text>
                  </View>
                )}
                {handleStatus === 'taken' && (
                  <View style={styles.availabilityRow}>
                    <MaterialIcons name="cancel" size={16} color={COLORS.error} style={styles.availabilityIcon} />
                    <Text style={styles.availabilityTaken}>{t('onboarding.profile.handleTaken')}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.bio')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder={t('onboarding.bioPlaceholder')}
              placeholderTextColor={COLORS.tertiary}
              multiline
              numberOfLines={3}
              maxLength={160}
            />
            <Text style={styles.charCount}>{bio.length}/160</Text>
          </View>

          <Pressable
            style={styles.privacyToggle}
            onPress={() => setIsProtected(!isProtected)}
          >
            <View style={styles.privacyTextContainer}>
              <View style={styles.privacyHeader}>
                <MaterialIcons
                  name={isProtected ? "lock" : "public"}
                  size={20}
                  color={isProtected ? COLORS.primary : COLORS.secondary}
                />
                <Text style={styles.privacyLabel}>
                  {isProtected ? t('common.private') : t('common.public')}
                </Text>
              </View>
              <Text style={styles.privacyDescription}>
                {isProtected
                  ? t('onboarding.privateDescription')
                  : t('onboarding.publicDescription')}
              </Text>
            </View>
            <View style={[styles.switch, isProtected && styles.switchActive]}>
              <View style={[styles.thumb, isProtected && styles.thumbActive]} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}>
        <Pressable
          style={[styles.button, (!canSubmit || loading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('common.loading') : t('common.continue')}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    alignItems: 'center',
    position: 'relative',
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: SPACING.l,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.divider,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  form: {
    gap: SPACING.xl,
  },
  inputGroup: {
    gap: SPACING.s,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  input: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPrefix: {
    position: 'absolute',
    left: SPACING.m,
    fontSize: 16,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    zIndex: 1,
  },
  inputWithPrefix: {
    paddingLeft: 32,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputSuccess: {
    borderColor: '#22c55e',
  },
  handleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  handleHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  handleHintError: {
    color: COLORS.error,
  },
  handleCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  availabilityIcon: {
    marginRight: 6,
  },
  availabilitySpinner: {
    marginRight: 4,
  },
  availabilityAvailable: {
    fontSize: 13,
    color: '#22c55e',
    fontFamily: FONTS.medium,
  },
  availabilityTaken: {
    fontSize: 13,
    color: COLORS.error,
    fontFamily: FONTS.medium,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.hover,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  privacyTextContainer: {
    flex: 1,
    marginRight: SPACING.m,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: 4,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  privacyDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  switch: {
    width: 48,
    height: 28,
    backgroundColor: COLORS.divider,
    borderRadius: 14,
    padding: 2,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.borderRadius,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.semiBold,
  },
});
