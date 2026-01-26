import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { buttonStyles, typographyStyles, toggleStyles } from '../../constants/designSystem';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },    


];

export default function OnboardingLanguagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [showOnlyMyLanguages, setShowOnlyMyLanguages] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (code: string) => {
    Haptics.selectionAsync();
    if (selectedLanguages.includes(code)) {
      setSelectedLanguages(selectedLanguages.filter(l => l !== code));
    } else if (selectedLanguages.length < 3) {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      await api.patch('/users/me', {
        languages: selectedLanguages,
        showOnlyMyLanguages: showOnlyMyLanguages,
      });
      router.push('/onboarding/starter-packs');
    } catch (error) {
      console.error('Failed to save languages', error);
      // Continue to next screen even if save fails
      router.push('/onboarding/starter-packs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={typographyStyles.title}>{t('onboarding.languages.title')}</Text>
        <Text style={typographyStyles.bodySecondary}>{t('onboarding.languages.subtitle')}</Text>

        <View style={styles.languagesGrid}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.languageChip,
                selectedLanguages.includes(lang.code) && styles.languageChipSelected,
              ]}
              onPress={() => toggleLanguage(lang.code)}
            >
              <Text
                style={[
                  styles.languageText,
                  selectedLanguages.includes(lang.code) && styles.languageTextSelected,
                ]}
              >
                {lang.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toggleContainer}>
          <Text style={typographyStyles.bodySecondary}>{t('onboarding.languages.showOnly')}</Text>
          <Pressable
            style={[toggleStyles.toggle, showOnlyMyLanguages && toggleStyles.toggleActive]}
            onPress={() => setShowOnlyMyLanguages(!showOnlyMyLanguages)}
            accessibilityRole="switch"
            accessibilityState={{ checked: showOnlyMyLanguages }}
          >
            <View style={[toggleStyles.thumb, showOnlyMyLanguages && toggleStyles.thumbActive]} />
          </Pressable>
        </View>

        <Pressable
          style={[buttonStyles.primary, (selectedLanguages.length === 0 || loading) && buttonStyles.primaryDisabled]}
          onPress={handleContinue}
          disabled={selectedLanguages.length === 0 || loading}
          accessibilityLabel={t('onboarding.languages.continue')}
          accessibilityRole="button"
          accessibilityState={{ disabled: selectedLanguages.length === 0 || loading }}
        >
          <Text style={buttonStyles.primaryText}>
            {loading ? t('common.loading') : t('onboarding.languages.continue')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.xxl,
    gap: SPACING.xxl,
  },
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
  },
  languageChip: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadiusPill,
  },
  languageChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  languageTextSelected: {
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
});
