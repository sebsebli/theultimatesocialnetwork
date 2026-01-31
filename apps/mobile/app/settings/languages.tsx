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
import { CONTENT_LANGUAGES } from '../../constants/languages';

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

  const filteredLanguages = CONTENT_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.native && l.native.toLowerCase().includes(search.toLowerCase()))
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
          {filteredLanguages.map((lang) => {
            const isSelected = selected.includes(lang.code);
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
    justifyContent: 'center',
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
