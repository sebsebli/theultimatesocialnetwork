import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [showWhy, setShowWhy] = useState(true);
  const [sliders, setSliders] = useState({
    topicsYouFollow: 80,
    languageMatch: 70,
    citations: 90,
    replies: 50,
    likes: 30,
    networkProximity: 40,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch initial settings
    api.get('/users/me').then((user: any) => {
      if (user.preferences?.explore) {
        const { showWhy: fetchedShowWhy, ...fetchedSliders } = user.preferences.explore;
        setSliders(prev => ({ ...prev, ...fetchedSliders }));
        if (fetchedShowWhy !== undefined) setShowWhy(fetchedShowWhy);
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        preferences: {
          explore: { ...sliders, showWhy }
        }
      });
      router.back();
    } catch (error) {
      console.error('Failed to save relevance settings', error);
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
    };
    setSliders(defaults);
    setShowWhy(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings.relevance')}</Text>
        <Pressable 
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => ({ opacity: pressed || saving ? 0.5 : 1 })}
        >
          <Text style={styles.headerSaveText}>{t('common.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
              label="Topics you follow" 
              valueKey="topicsYouFollow" 
              value={sliders.topicsYouFollow}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider 
              label="Language match" 
              valueKey="languageMatch" 
              value={sliders.languageMatch}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider 
              label="Citations / Quotes" 
              valueKey="citations" 
              value={sliders.citations}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider 
              label="Replies / Discussion" 
              valueKey="replies" 
              value={sliders.replies}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider 
              label="Likes (Private Signal)" 
              valueKey="likes" 
              value={sliders.likes}
              onValueChange={handleSliderChange}
            />
            <RelevanceSlider 
              label="Network Proximity" 
              valueKey="networkProximity" 
              value={sliders.networkProximity}
              onValueChange={handleSliderChange}
            />

            <View style={[styles.toggleRow, styles.showWhyToggle]}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>{t('settings.showWhy')}</Text>
                <Text style={styles.toggleDesc}>{t('settings.showWhyDesc')}</Text>
              </View>
              <Switch
                value={showWhy}
                onValueChange={setShowWhy}
                trackColor={{ false: COLORS.divider, true: COLORS.primary }}
                thumbColor={COLORS.paper}
              />
            </View>

            <Pressable onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetText}>{t('settings.resetDefaults')}</Text>
            </Pressable>
          </View>
        )}
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
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  headerSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
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
  showWhyToggle: {
    marginTop: SPACING.l,
    paddingTop: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
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
