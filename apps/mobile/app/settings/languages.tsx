import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

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
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(['en']); // Should load from user profile
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleLanguage = (code: string) => {
    if (selected.includes(code)) {
      setSelected(selected.filter(c => c !== code));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, code]);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // API call to save languages
      // await api.patch('/users/me/languages', { languages: selected });
      Alert.alert(t('keeps.success'), t('settings.languagesUpdated'));
      router.back();
    } catch (error) {
      console.error('Failed to save languages', error);
      Alert.alert(t('common.error'), t('settings.failedSaveLanguages'));
    } finally {
      setSaving(false);
    }
  };

  const filteredLanguages = LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.languages')}</Text>
        <Pressable 
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({ opacity: pressed || saving ? 0.5 : 1 })}
        >
          <Text style={styles.headerSaveText}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('onboarding.languages.search')}
          placeholderTextColor={COLORS.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.content}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
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
