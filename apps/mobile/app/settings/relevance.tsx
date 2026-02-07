import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader, headerRightSaveStyle } from '../../components/ScreenHeader';
import { api } from '../../utils/api';

// Moved outside to prevent re-mounting on every render
const RelevanceSlider = ({
  label,
  valueKey,
  value,
  onValueChange
}: {
  label: string,
  valueKey: string,
  value: number,
  onValueChange: (key: string, val: number) => void
}) => (
  <View style={styles.sliderContainer}>
    <View style={styles.sliderHeader}>
      <Text style={styles.sliderLabel}>{label}</Text>
      <Text style={styles.sliderValue}>{Math.round(value)}%</Text>
    </View>
    <Slider
      style={styles.slider}
      minimumValue={0}
      maximumValue={100}
      value={value}
      onValueChange={(val: number) => onValueChange(valueKey, val)}
      minimumTrackTintColor={COLORS.primary}
      maximumTrackTintColor={COLORS.divider}
      thumbTintColor={COLORS.paper}
    />
  </View>
);

export default function RelevanceSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [enabled, setEnabled] = useState(true);
  const [sliders, setSliders] = useState({
    topicsYouFollow: 80,
    languageMatch: 70,
    citations: 90,
    replies: 50,
    likes: 30,
    networkProximity: 40,
    depth: 50,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch initial settings
    api.get('/users/me').then((user: unknown) => {
      const userObj = user as Record<string, unknown>;
      const userPrefs = userObj.preferences as { explore?: Record<string, unknown> } | undefined;
      if (userPrefs?.explore) {
        const { showWhy: _omit, recommendationsEnabled, ...fetchedSliders } = userPrefs.explore;
        setSliders(prev => ({ ...prev, ...fetchedSliders as typeof sliders }));
        setEnabled(recommendationsEnabled !== false);
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        preferences: {
          explore: { recommendationsEnabled: enabled, ...sliders }
        }
      });
      router.back();
    } catch (error) {
      if (__DEV__) console.error('Failed to save relevance settings', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSliderChange = (key: string, value: number) => {
    setSliders(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const defaults = {
      topicsYouFollow: 80,
      languageMatch: 70,
      citations: 90,
      replies: 50,
      likes: 30,
      networkProximity: 40,
      depth: 50,
    };
    setSliders(defaults);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t('settings.relevance')}
        paddingTop={insets.top}
        right={
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }: { pressed: boolean }) => [{ padding: SPACING.s, margin: -SPACING.s }, (pressed || saving) && { opacity: 0.5 }]}
          >
            <Text style={headerRightSaveStyle}>{t('common.save')}</Text>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>{t('settings.enableRecommendations')}</Text>
            <Text style={styles.toggleDesc}>{t('settings.enableRecommendationsDesc')}</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: COLORS.divider, true: COLORS.primary }}
            thumbColor={COLORS.paper}
          />
        </View>

        {enabled && (
          <View style={styles.controls}>
            <RelevanceSlider
              label={t("settings.relevanceTopics", "Topics you follow")}
              valueKey="topicsYouFollow"
              value={sliders.topicsYouFollow}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider
              label={t("settings.relevanceLanguage", "Language match")}
              valueKey="languageMatch"
              value={sliders.languageMatch}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider
              label={t("settings.relevanceCitations", "Citations / Quotes")}
              valueKey="citations"
              value={sliders.citations}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider
              label={t("settings.relevanceReplies", "Replies / Discussion")}
              valueKey="replies"
              value={sliders.replies}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider
              label={t("settings.relevanceLikes", "Likes (Private Signal)")}
              valueKey="likes"
              value={sliders.likes}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider
              label={t("settings.relevanceNetwork", "Network Proximity")}
              valueKey="networkProximity"
              value={sliders.networkProximity}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider
              label={t("settings.relevanceDepth", "Depth / Length")}
              valueKey="depth"
              value={sliders.depth}
              onValueChange={handleSliderChange}
            />

            <Pressable
              onPress={handleReset}
              style={styles.resetButton}
              accessibilityRole="button"
              accessibilityLabel={t('settings.resetDefaults')}
            >
              <Text style={styles.resetText}>{t('settings.resetDefaults')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    padding: SPACING.l,
    paddingBottom: 100,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  toggleText: {
    flex: 1,
    marginRight: SPACING.m,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  toggleDesc: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  controls: {
    gap: SPACING.l,
  },
  sliderContainer: {
    marginBottom: SPACING.m,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  sliderLabel: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  sliderValue: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  resetButton: {
    padding: SPACING.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    marginTop: SPACING.l,
  },
  resetText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
});