import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
];

export default function OnboardingLanguagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [onlyMyLanguages, setOnlyMyLanguages] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(prev => prev.filter(c => c !== code));
      }
    } else {
      if (selectedLanguages.length < 3) {
        setSelectedLanguages(prev => [...prev, code]);
      } else {
        showToast('You can select up to 3 languages');
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.patch('/users/me', {
        languages: selectedLanguages,
      });
      router.push('/onboarding/profile');
    } catch (error: any) {
      console.error('Failed to update languages', error);
      showError(t('onboarding.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
        </View>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.secondary} />
        </Pressable>
        <Pressable onPress={() => router.push('/onboarding/profile')} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('onboarding.languages.languagesTitle')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.languages.languagesSubtitle')}</Text>

        <View style={styles.grid}>
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.code);
            return (
              <Pressable
                key={lang.code}
                style={[styles.langCard, isSelected && styles.langCardSelected]}
                onPress={() => toggleLanguage(lang.code)}
              >
                <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                  {lang.name}
                </Text>
                <Text style={[styles.langNative, isSelected && styles.langNativeSelected]}>
                  {lang.native}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <MaterialIcons name="check" size={12} color="#FFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.toggleRow}
          onPress={() => setOnlyMyLanguages(!onlyMyLanguages)}
        >
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>{t('onboarding.languages.filterExplore')}</Text>
            <Text style={styles.toggleDesc}>{t('onboarding.languages.filterExploreDesc')}</Text>
          </View>
          <View style={[styles.switch, onlyMyLanguages && styles.switchActive]}>
            <View style={[styles.thumb, onlyMyLanguages && styles.thumbActive]} />
          </View>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}>
        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? t('common.loading') : t('common.continue')}
          </Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </Pressable>
      </View>
    </View>
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
  skipButton: {
    position: 'absolute',
    right: SPACING.l,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  langCard: {
    width: '47%',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    position: 'relative',
  },
  langCardSelected: {
    backgroundColor: 'rgba(110, 122, 138, 0.1)',
    borderColor: COLORS.primary,
  },
  langName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  langNameSelected: {
    color: COLORS.primary,
  },
  langNative: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  langNativeSelected: {
    color: COLORS.tertiary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.hover,
    padding: SPACING.l,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  toggleText: {
    flex: 1,
    marginRight: SPACING.m,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  toggleDesc: {
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