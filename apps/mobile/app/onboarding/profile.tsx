import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const handleSubmit = async () => {
    if (!displayName.trim() || !handle.trim()) {
      showError(t('onboarding.fieldsRequired'));
      return;
    }

    setLoading(true);
    try {
      await api.patch('/users/me', {
        displayName: displayName.trim(),
        handle: handle.trim().toLowerCase(),
        bio: bio.trim(),
        isProtected,
      });
      router.push('/onboarding/languages');
    } catch (error: any) {
      console.error('Failed to update profile', error);
      showError(error?.message || t('onboarding.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>{t('onboarding.createProfile')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.profileSubtitle')}</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.displayName')}</Text>
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
            <Text style={styles.label}>{t('profile.handle')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={[styles.input, styles.inputWithPrefix]}
                value={handle}
                onChangeText={(text) => setHandle(text.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="janedoe"
                placeholderTextColor={COLORS.tertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
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
          style={[styles.button, (!displayName.trim() || !handle.trim() || loading) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!displayName.trim() || !handle.trim() || loading}
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
