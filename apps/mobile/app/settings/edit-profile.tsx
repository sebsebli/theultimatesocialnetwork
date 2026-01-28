import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
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

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('available'); // Assume available initially if unchanged
  const [initialHandle, setInitialHandle] = useState('');
  
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await api.get<any>('/users/me');
        if (user) {
          setDisplayName(user.displayName || '');
          setHandle(user.handle || '');
          setInitialHandle(user.handle || '');
          setBio(user.bio || '');
          setIsProtected(user.isProtected || false);
        }
      } catch (e) {
        showError(t('common.error'));
      } finally {
        setInitialLoading(false);
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
    if (norm === initialHandle.toLowerCase()) {
      setHandleStatus('available');
      return;
    }
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
  }, [initialHandle]);

  useEffect(() => {
    if (initialLoading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (normalizedHandle === initialHandle.toLowerCase()) {
      setHandleStatus('available');
      return;
    }

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
  }, [handle, handleLen, handleTooShort, handleTooLong, checkAvailability, initialHandle, initialLoading]);

  const handleSubmit = async () => {
    if (!displayName.trim() || !handle.trim()) {
      showError(t('onboarding.fieldsRequired'));
      return;
    }
    if (handleStatus !== 'available') {
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
      showSuccess(t('settings.profileUpdated'));
      router.back();
    } catch (error: any) {
      console.error('Failed to update profile', error);
      showError(error?.message || t('onboarding.profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = Boolean(displayName.trim() && normalizedHandle.length >= HANDLE_MIN && normalizedHandle.length <= HANDLE_MAX && handleStatus === 'available' && !loading);

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.editProfile')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content}>
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
              {handle !== initialHandle && handleLen >= HANDLE_MIN && (
                <View style={styles.availabilityRow}>
                  {handleStatus === 'checking' && (
                    <ActivityIndicator size="small" color={COLORS.primary} style={styles.availabilitySpinner} />
                  )}
                  {handleStatus === 'available' && (
                    <Text style={styles.availabilityAvailable}>{t('onboarding.profile.handleAvailable')}</Text>
                  )}
                  {handleStatus === 'taken' && (
                    <Text style={styles.availabilityTaken}>{t('onboarding.profile.handleTaken')}</Text>
                  )}
                </View>
              )}
              <Text style={styles.handleCount}>
                You can change your username once every 14 days.
              </Text>
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
              {loading ? t('common.loading') : t('common.save')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  backButton: {
    padding: SPACING.s,
    marginLeft: -SPACING.s,
  },
  content: {
    padding: SPACING.xl,
    paddingBottom: 100,
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
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
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
