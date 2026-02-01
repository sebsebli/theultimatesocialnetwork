import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { COLORS, SPACING, SIZES, FONTS, createStyles } from '../constants/theme';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function WaitingListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
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
      showError(t('waitingList.emailRequired', 'Email is required'));
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      showError(t('waitingList.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    if (!acceptedTerms) {
      showError(t('waitingList.acceptTermsRequired'));
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.post('/waiting-list', { email: sanitizedEmail });
      showSuccess(t('waitingList.successMessage', "You've been added to the waiting list! We'll notify you when invites are available."));
      router.back();
    } catch (error: any) {
      console.error('Failed to join waiting list', error);
      const errorMessage = error?.status === 429
        ? t('waitingList.rateLimited', 'Too many requests. Please try again later.')
        : error?.status === 403
          ? t('waitingList.tooManyRequests', 'Too many requests from this IP address.')
          : t('waitingList.failed', 'Failed to join waiting list. Please try again.');
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('waitingList.title', 'Join Waiting List')} paddingTop={Math.max(insets.top, SPACING.m)} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentKeyboardVisible,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.textGroup}>
              <Text style={styles.title}>{t('waitingList.heading', 'Get Early Access')}</Text>
              <Text style={styles.description}>
                {t('waitingList.description', 'Citewalk is currently in beta. Join the waiting list to be notified when invites become available.')}
              </Text>
            </View>

            <View style={styles.formGroup}>
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
                        <MaterialCommunityIcons name="check" size={12} color={COLORS.ink} />
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
            </View>

            <Text style={styles.infoText}>
              {t('waitingList.info', 'We\'ll only use your email to notify you about invite availability.')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = createStyles({
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
    backgroundColor: COLORS.ink,
  },
  backButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  keyboardAvoid: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: 32, // Match back button size approx
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  scrollContentKeyboardVisible: {
    paddingTop: SPACING.l,
  },
  content: {
    gap: SPACING.xxl,
  },
  textGroup: {
    gap: SPACING.m,
  },
  title: {
    fontSize: 32,
    color: COLORS.paper,
    fontFamily: FONTS.serifSemiBold,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  description: {
    fontSize: 17,
    color: COLORS.secondary,
    lineHeight: 26,
    fontFamily: FONTS.serifRegular,
  },
  formGroup: {
    gap: SPACING.l,
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
    fontSize: 13,
    color: COLORS.tertiary,
    textAlign: 'center',
    fontFamily: FONTS.regular,
    marginTop: -SPACING.s,
  },
  termsContainer: {
    marginBottom: SPACING.xs,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.m,
  },
  checkboxPressable: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
    marginTop: -SPACING.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.tertiary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  termsLink: {
    color: COLORS.paper,
    textDecorationLine: 'underline',
  },
});
