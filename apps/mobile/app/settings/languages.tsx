import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'ru', name: 'Русский' },
  { code: 'fi', name: 'Suomi' },
  { code: 'sv', name: 'Svenska' },
  { code: 'no', name: 'Norsk' },
  { code: 'da', name: 'Dansk' },
  { code: 'cs', name: 'Čeština' },
  { code: 'hu', name: 'Magyar' },
];

export default function SettingsLanguagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const [selected, setSelected] = useState<string[]>(['en']);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me').then((u: any) => {
      if (u?.languages?.length) setSelected(u.languages);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const toggleLanguage = (code: string) => {
    if (selected.includes(code)) {
      if (selected.length <= 1) return;
      setSelected(selected.filter(c => c !== code));
    } else {
      if (selected.length >= 3) return;
      setSelected([...selected, code]);
    }
  };

  const handleSave = async () => {
    if (selected.length < 1) {
      showError(t('settings.languagesMinOne', 'Select at least one content language.'));
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me', { languages: selected });
      showSuccess(t('settings.languagesUpdated'));
      router.back();
    } catch (error) {
      console.error('Failed to save languages', error);
      showError(t('settings.failedSaveLanguages'));
    } finally {
      setSaving(false);
    }
  };

  const filteredLanguages = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('settings.languages')}
        paddingTop={insets.top}
        right={
          <Pressable
            onPress={handleSave}
            disabled={saving || selected.length < 1}
            style={({ pressed }: { pressed: boolean }) => [{ padding: SPACING.s, margin: -SPACING.s }, (pressed || saving || selected.length < 1) && { opacity: 0.5 }]}
          >
            <Text style={styles.headerSaveText}>{t('common.save')}</Text>
          </Pressable>
        }
      />

      <Text style={styles.hint}>
        {t('settings.contentLanguagesHint', 'Content languages: which languages you want in Explore and recommendations. App language follows your device.')}
      </Text>
      <Text style={styles.minMaxHint}>
        {t('settings.languagesMinMax', 'Select 1–3 languages.')}
      </Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('onboarding.languages.search')}
          placeholderTextColor={COLORS.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {filteredLanguages.map((lang) => (
            <Pressable
              key={lang.code}
              style={[
                styles.languageButton,
                selected.includes(lang.code) && styles.languageButtonSelected
              ]}
              onPress={() => toggleLanguage(lang.code)}
            >
              <Text style={[
                styles.languageText,
                selected.includes(lang.code) && styles.languageTextSelected
              ]}>
                {lang.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  hint: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    lineHeight: 20,
  },
  minMaxHint: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
    paddingHorizontal: SPACING.l,
    paddingTop: 4,
    marginBottom: SPACING.s,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: HEADER.saveColor,
    fontFamily: FONTS.semiBold,
  },
  searchContainer: {
    padding: SPACING.l,
  },
  searchInput: {
    height: 50,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    color: COLORS.paper,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.pressed,
    fontFamily: FONTS.regular,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
  },
  languageButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.pressed,
  },
  languageButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageText: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  languageTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  footer: {
    padding: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  saveButton: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
});
