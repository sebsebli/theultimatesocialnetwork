import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, getImageUrl } from '../../utils/api';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useToast } from '../../context/ToastContext';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { ImageVerifyingOverlay } from '../../components/ImageVerifyingOverlay';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, MODAL, createStyles } from '../../constants/theme';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [avatarLocalUri, setAvatarLocalUri] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('available');
  const [initialHandle, setInitialHandle] = useState('');
  const [avatarActionSheetVisible, setAvatarActionSheetVisible] = useState(false);

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
          setAvatarUrl(user.avatarUrl || null);
          setAvatarKey(user.avatarKey || null);
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
  const isHandleChanged = normalizedHandle !== initialHandle.toLowerCase();

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

  const showAvatarActions = () => setAvatarActionSheetVisible(true);

  /** Close the avatar sheet first, then run fn after interactions + delay so the image picker can present (avoids modal conflict). */
  const closeAvatarSheetAndThen = useCallback((fn: () => void) => {
    setAvatarActionSheetVisible(false);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(fn, 500);
    });
  }, []);

  const removeAvatar = async () => {
    try {
      setAvatarUploading(true);
      await api.patch('/users/me', { avatarKey: null });
      setAvatarUrl(null);
      setAvatarLocalUri(null);
      showSuccess(t('settings.photoRemoved', 'Profile photo removed.'));
    } catch (err: any) {
      showError(err?.message || t('common.error'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const avatarOptions = [
    { label: t('settings.takePhoto', 'Take photo'), onPress: () => closeAvatarSheetAndThen(() => pickImage('camera')), icon: 'camera-alt' as const },
    { label: t('settings.choosePhoto', 'Choose from library'), onPress: () => closeAvatarSheetAndThen(() => pickImage('library')), icon: 'photo-library' as const },
    ...(avatarKey || avatarUrl || avatarLocalUri ? [{ label: t('settings.removePhoto', 'Remove photo'), onPress: () => closeAvatarSheetAndThen(removeAvatar), destructive: true as const, icon: 'delete-outline' as const }] : []),
  ];

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError(t('settings.photoPermissionDenied', 'Permission to access photos is required.'));
        return;
      }
      const pickerOptions = { mediaTypes: ['images'] as const, allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.8 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setAvatarUploading(true);
      const uploadRes = await api.upload<{ key?: string; url?: string }>('/upload/profile-picture', asset);
      const key = uploadRes?.key ?? (uploadRes as any)?.data?.key;
      if (!key || typeof key !== 'string') {
        showError(t('profile.photoUpdateFailed', 'Failed to update photo.'));
        return;
      }
      await api.patch('/users/me', { avatarKey: key });
      setAvatarUrl((uploadRes?.url ?? (uploadRes as any)?.url) || getImageUrl(key));
      setAvatarKey(key);
      setAvatarLocalUri(asset.uri);
      showSuccess(t('settings.photoUpdated', 'Profile photo updated.'));
    } catch (err: any) {
      showError(err?.message || t('common.error'));
    } finally {
      setAvatarUploading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('settings.editProfile')} paddingTop={insets.top} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
          <View style={styles.form}>
            <Pressable style={styles.avatarSection} onPress={avatarUploading ? undefined : showAvatarActions} disabled={avatarUploading}>
              <View style={styles.avatarRing}>
                {(avatarUrl || avatarLocalUri) ? (
                  <Image source={{ uri: avatarLocalUri || avatarUrl || '' }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarPlaceholder}>
                    {(displayName || handle || '?').charAt(0).toUpperCase()}
                  </Text>
                )}
                {avatarUploading && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator size="small" color={COLORS.ink} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <MaterialIcons name="camera-alt" size={HEADER.iconSize} color={COLORS.ink} />
                </View>
              </View>
              <Text style={styles.avatarHint}>{t('settings.tapToChangePhoto', 'Tap to change photo')}</Text>
            </Pressable>

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
                    isHandleChanged && handleStatus === 'taken' && styles.inputError,
                    isHandleChanged && handleStatus === 'available' && styles.inputSuccess,
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
              {handle !== initialHandle && (
                <Text style={styles.handleCount}>
                  {t('settings.handleChangeHint', 'You can change your username once every 14 days.')}
                </Text>
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
                    size={HEADER.iconSize}
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

      <ImageVerifyingOverlay visible={avatarUploading} />

      <OptionsActionSheet
        visible={avatarActionSheetVisible}
        title={t('settings.profilePhoto', 'Profile photo')}
        options={avatarOptions}
        cancelLabel={t('common.cancel')}
        onCancel={() => setAvatarActionSheetVisible(false)}
      />
    </View>
  );
}

const styles = createStyles({
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: LAYOUT.contentPaddingVertical,
    paddingBottom: 100,
  },
  form: {
    gap: SPACING.l,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    borderWidth: 2,
    borderColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginTop: SPACING.s,
    fontFamily: FONTS.regular,
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
    borderColor: COLORS.primary,
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
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  availabilityTaken: {
    fontSize: 13,
    color: COLORS.error,
    fontFamily: FONTS.medium,
  },
  handleCount: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginTop: 4,
    fontFamily: FONTS.regular,
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
    backgroundColor: COLORS.paper,
  },
  thumbActive: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    backgroundColor: MODAL.primaryButtonBackgroundColor,
    borderRadius: MODAL.buttonBorderRadius,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.primaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});
