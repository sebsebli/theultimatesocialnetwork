import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';
import { IntroModal, shouldShowIntro } from '../components/IntroModal';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    checkIntro();
  }, []);

  const checkIntro = async () => {
    const shouldShow = await shouldShowIntro();
    setShowIntro(shouldShow);
  };

  const handleIntroClose = () => {
    setShowIntro(false);
  };


  return (
    <View style={styles.container}>
      {/* Top spacer - matches web h-1/6 */}
      <View style={styles.topSpacer} />

      {/* Main Content - Centered */}
      <View style={styles.content}>
        {/* Logo - Matches web app styling exactly */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoIconContainer}>
              <MaterialCommunityIcons name="code-brackets" size={40} color="rgba(255, 255, 255, 0.9)" />
            </View>
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <Pressable
          style={styles.continueButton}
          onPress={() => {
            console.log('Navigating to sign-in...');
            router.push('/sign-in');
          }}
        >
          <Text style={styles.continueButtonText}>{t('welcome.continue')}</Text>
        </Pressable>

        <View style={styles.legalLinks}>
          <Pressable onPress={() => router.push('/privacy')}>
            <Text style={styles.legalLink}>{t('welcome.privacy')}</Text>
          </Pressable>
          <View style={styles.legalSeparator} />
          <Pressable onPress={() => router.push('/terms')}>
            <Text style={styles.legalLink}>{t('welcome.terms')}</Text>
          </Pressable>
          <View style={styles.legalSeparator} />
          <Pressable onPress={() => router.push('/imprint')}>
            <Text style={styles.legalLink}>{t('welcome.imprint')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Background Pattern - matches web app */}
      <View style={styles.backgroundPattern} />

      {/* Intro Modal */}
      <IntroModal visible={showIntro} onClose={handleIntroClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl, // px-6
    paddingTop: 48, // pt-12
    paddingBottom: SPACING.xl, // pb-8
  },
  topSpacer: {
    height: '16.67%', // h-1/6 equivalent
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xxl, // gap-6
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(255, 255, 255, 0.05)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 0,
  },
  logoIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: SPACING.l,
    marginTop: SPACING.s,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.paper,
    letterSpacing: -0.5,
    fontFamily: FONTS.semiBold,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.secondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  bottomSection: {
    gap: SPACING.xl, // gap-8
    width: '100%',
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.015,
    fontFamily: FONTS.semiBold,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  legalSeparator: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.tertiary,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03, // opacity-[0.03]
    // Background pattern SVG would be rendered here if needed
    // For now, we'll use a simple overlay
    backgroundColor: 'transparent',
  },
});
