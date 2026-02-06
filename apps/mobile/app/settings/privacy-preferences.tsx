import React, { useState, useEffect } from "react";
import { Text, View, ScrollView, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useToast } from "../../context/ToastContext";
import { api } from "../../utils/api";
import {
  COLORS,
  SPACING,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from "../../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";

interface PrivacySettings {
  disableRecommendations?: boolean;
  disableModerationProfiling?: boolean;
  disableAnalytics?: boolean;
}

export default function PrivacyPreferencesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PrivacySettings>("/users/me/privacy-settings")
      .then((data) => {
        setSettings(data ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    try {
      await api.patch("/users/me/privacy-settings", { [key]: value });
      showSuccess(t("settings.privacyUpdated", "Preferences saved"));
    } catch {
      setSettings(settings); // revert
      showError(t("settings.updateFailed", "Couldn't save changes"));
    }
  };

  const PrivacyToggle = ({
    icon,
    label,
    description,
    legalBasis,
    settingKey,
  }: {
    icon: string;
    label: string;
    description: string;
    legalBasis: string;
    settingKey: keyof PrivacySettings;
  }) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <MaterialIcons
          name={icon as any}
          size={HEADER.iconSize}
          color={COLORS.secondary}
        />
        <View style={styles.toggleContent}>
          <Text style={styles.toggleLabel}>{label}</Text>
          <Text style={styles.toggleDesc}>{description}</Text>
          <Text style={styles.toggleLegal}>{legalBasis}</Text>
        </View>
      </View>
      <Switch
        value={!settings[settingKey]}
        onValueChange={(v: boolean) => updateSetting(settingKey, !v)}
        trackColor={{ false: COLORS.divider, true: COLORS.primary }}
        thumbColor={COLORS.paper}
        disabled={loading}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("settings.dataProcessingPreferences", "Data Processing")}
        titleIcon="privacy-tip"
        paddingTop={insets.top}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <MaterialIcons
            name="info-outline"
            size={18}
            color={COLORS.secondary}
          />
          <Text style={styles.infoText}>
            {t(
              "settings.privacyInfoText",
              "Under GDPR Art. 21, you have the right to object to processing based on legitimate interest. Toggle off any processing you wish to opt out of. Essential processing (security, authentication) cannot be disabled.",
            )}
          </Text>
        </View>

        <PrivacyToggle
          icon="explore"
          label={t(
            "settings.privacyRecommendations",
            "Personalised recommendations",
          )}
          description={t(
            "settings.privacyRecommendationsDesc",
            "AI-based content suggestions in Explore feed",
          )}
          legalBasis="Art. 6(1)(f) GDPR — Legitimate interest"
          settingKey="disableRecommendations"
        />

        <PrivacyToggle
          icon="analytics"
          label={t("settings.privacyAnalytics", "Read time & view analytics")}
          description={t(
            "settings.privacyAnalyticsDesc",
            "Tracking reading time and post views for content quality signals",
          )}
          legalBasis="Art. 6(1)(f) GDPR — Legitimate interest"
          settingKey="disableAnalytics"
        />

        <PrivacyToggle
          icon="security"
          label={t(
            "settings.privacyModerationProfiling",
            "Moderation profiling",
          )}
          description={t(
            "settings.privacyModerationProfilingDesc",
            "Using your posting history to adjust trust scores. Note: content safety checks remain active regardless.",
          )}
          legalBasis="Art. 6(1)(f) GDPR — Legitimate interest"
          settingKey="disableModerationProfiling"
        />

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            {t(
              "settings.privacyFooterNote",
              "For other data processing objections or to exercise further GDPR rights, contact hello@citewalk.com. We will respond within one month.",
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: COLORS.ink },
  content: { paddingBottom: 100 },
  infoBox: {
    flexDirection: "row",
    gap: SPACING.m,
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
    marginTop: SPACING.xl,
    marginBottom: SPACING.l,
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.m,
    flex: 1,
    paddingRight: SPACING.m,
  },
  toggleContent: { flex: 1 },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginBottom: 4,
    lineHeight: 18,
  },
  toggleLegal: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    fontStyle: "italic",
  },
  footerNote: {
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
    marginTop: SPACING.xl,
    padding: SPACING.m,
  },
  footerNoteText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    textAlign: "center",
  },
});
