import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, ScrollView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function WaitingListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Calculate keyboard offset accounting for offline banner
  // Banner height: ~40px (padding + text + icon) + safe area top
  const offlineBannerHeight = isOffline ? Math.max(insets.top, SPACING.s) + 40 : 0;
  const keyboardVerticalOffset = Platform.OS === 'ios' ? offlineBannerHeight : 0;

  // Get base URL for legal links
  const getBaseUrl = () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    if (apiUrl.includes('api.')) {
      return apiUrl.replace('api.', '');
    }
    return apiUrl.replace('/api', '').replace(/\/$/, '');
  };

  const openLegalLink = async (path: string) => {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${path}`;
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
    } catch (error) {
      console.error('Failed to open browser:', error);
    }
  };

  const isValidEmail = (email: string) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  };

  const handleJoin = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail) {
      Alert.alert(t('common.error', 'Error'), t('waitingList.emailRequired', 'Email is required'));
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      Alert.alert(t('common.error', 'Error'), t('waitingList.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(t('common.error', 'Error'), t('waitingList.acceptTermsRequired'));
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post('/waiting-list', { email: sanitizedEmail });
      Alert.alert(
        t('waitingList.success', 'Success'),
        t('waitingList.successMessage', 'You\'ve been added to the waiting list! We\'ll notify you when invites are available.'),
        [
          {
            text: t('common.ok', 'OK'),
            onPress: () => router.back(),
          }
        ]
      );
    } catch (error: any) {
      console.error('Failed to join waiting list', error);
      const errorMessage = error?.status === 429
        ? t('waitingList.rateLimited', 'Too many requests. Please try again later.')
        : error?.status === 403
          ? t('waitingList.tooManyRequests', 'Too many requests from this IP address.')
          : t('waitingList.failed', 'Failed to join waiting list. Please try again.');
      Alert.alert(t('common.error', 'Error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel={t('common.goBack', 'Go back')} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('waitingList.title', 'Join Waiting List')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentKeyboardVisible,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{t('waitingList.heading', 'Get Early Access')}</Text>
            <Text style={styles.description}>
              {t('waitingList.description', 'CITE is currently in beta. Join the waiting list to be notified when invites become available.')}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={t('waitingList.emailPlaceholder', 'Enter your email')}
              placeholderTextColor={COLORS.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              accessibilityLabel={t('waitingList.emailPlaceholder', 'Enter your email')}
            />

            {/* Terms and Privacy Acceptance */}
            <View style={styles.termsContainer}>
              <View style={styles.checkboxContainer}>
                <Pressable
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  style={styles.checkboxPressable}
                >
                  <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                    {acceptedTerms && (
                      <MaterialCommunityIcons name="check" size={16} color={COLORS.ink} />
                    )}
                  </View>
                </Pressable>
                <Text style={styles.termsText}>
                  {(() => {
                    const agreementText = t('signIn.signUpAgreement', {
                      terms: t('signIn.termsLink'),
                      privacy: t('signIn.privacyLink'),
                    });
                    const termsText = t('signIn.termsLink');
                    const privacyText = t('signIn.privacyLink');

                    const parts = agreementText.split(/({{terms}}|{{privacy}})/);
                    return parts.map((part, index) => {
                      if (part === '{{terms}}') {
                        return (
                          <Text
                            key={index}
                            style={styles.termsLink}
                            onPress={() => openLegalLink('/terms')}
                            suppressHighlighting={false}
                          >
                            {termsText}
                          </Text>
                        );
                      }
                      if (part === '{{privacy}}') {
                        return (
                          <Text
                            key={index}
                            style={styles.termsLink}
                            onPress={() => openLegalLink('/privacy')}
                            suppressHighlighting={false}
                          >
                            {privacyText}
                          </Text>
                        );
                      }
                      return <Text key={index}>{part}</Text>;
                    });
                  })()}
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.button, (!email.trim() || loading || !acceptedTerms) && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={!email.trim() || loading || !acceptedTerms}
              accessibilityLabel={t('waitingList.join', 'Join Waiting List')}
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>
                {loading ? t('common.loading', 'Loading...') : t('waitingList.join', 'Join Waiting List')}
              </Text>
            </Pressable>

            <Text style={styles.infoText}>
              {t('waitingList.info', 'We\'ll only use your email to notify you about invite availability.')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingVertical: SPACING.m,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.xl,
    justifyContent: 'center',
  },
  scrollContentKeyboardVisible: {
    justifyContent: 'flex-start',
    paddingTop: SPACING.l,
  },
  content: {
    gap: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: COLORS.secondary,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  input: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    height: 56,
    paddingHorizontal: SPACING.l,
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  termsContainer: {
    marginTop: SPACING.s,
    marginBottom: SPACING.s,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.m,
  },
  checkboxPressable: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  termsLink: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    textDecorationLine: 'underline',
  },
});
