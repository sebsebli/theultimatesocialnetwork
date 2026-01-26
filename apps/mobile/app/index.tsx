import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, Linking, useWindowDimensions, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../utils/api';
import { useAuth } from '../context/auth';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';
import { IntroModal, shouldShowIntro } from '../components/IntroModal';

export default function IndexScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const screenHeight = Dimensions.get('window').height;

  // Intro State
  const [showIntro, setShowIntro] = useState(false);

  // Auth State
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const isValidEmail = (email: string) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  };

  const handleSendLink = async () => {
    const sanitizedEmail = email.trim().toLowerCase();

    if (!sanitizedEmail) {
      Alert.alert(t('signIn.error'), t('signIn.emailRequired') || 'Email is required');
      return;
    }

    if (!isValidEmail(sanitizedEmail)) {
      Alert.alert(t('signIn.error'), t('signIn.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    // Check if terms are accepted (only for new signups, not for existing users)
    if (showInviteInput && !acceptedTerms) {
      Alert.alert(t('signIn.error'), 'Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/login', {
        email: sanitizedEmail,
        inviteCode: showInviteInput ? (inviteCode.trim() || undefined) : undefined
      });
      setSent(true);
      setCooldown(60);
      Alert.alert(t('signIn.success'), 'Verification code sent to your email');
    } catch (error: any) {
      // Check for specific beta invite requirement
      if (error?.status === 400 && error.message === 'Invite code required for registration') {
        setShowInviteInput(true);
        Alert.alert(
          'Invite Code Required',
          'You are new here! Please enter your invite code to join the beta.'
        );
        setLoading(false);
        return;
      }

      // Check for rate limit
      if (error?.status === 400 && error.message === 'Please wait before sending another code') {
        setCooldown(60);
        Alert.alert('Too Many Requests', 'Please wait 60 seconds before requesting another code.');
        setLoading(false);
        return;
      }

      const errorMessage = error?.status === 429
        ? t('signIn.rateLimited') || 'Too many requests. Please try again later.'
        : t('signIn.failedSend') || 'Failed to send verification code';
      Alert.alert(t('signIn.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token.trim()) return;

    if (!/^[a-zA-Z0-9]{4,10}$/.test(token.trim())) {
      Alert.alert(t('signIn.error'), t('signIn.invalid') || 'Invalid token format');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify', {
        email: email.trim().toLowerCase(),
        token: token.trim()
      });
      const { accessToken, user } = response;

      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Invalid response from server');
      }

      await SecureStore.setItemAsync('user', JSON.stringify(user));
      await signIn(accessToken);

    } catch (error: any) {
      const errorMessage = error?.status === 401
        ? t('signIn.invalid') || 'Invalid token'
        : t('signIn.error') || 'An error occurred';
      Alert.alert(t('signIn.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get base URL for legal links (use API base URL, assuming web is on same domain or subdomain)
  const getBaseUrl = () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    // If API is on a subdomain like api.cite.app, use the main domain
    if (apiUrl.includes('api.')) {
      return apiUrl.replace('api.', '');
    }
    // Otherwise assume web is on same base
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
      // Fallback to regular linking
      Linking.openURL(url);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.centeredContent}>
        {/* Main Content - Centered */}
        <View style={styles.mainContent}>
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <View style={styles.logoIconContainer}>
                  <MaterialCommunityIcons name="code-brackets" size={40} color="rgba(255, 255, 255, 0.9)" />
                </View>
              </View>
            </View>

            {/* Title & Subtitle - Hide when entering token to save space */}
            {!sent && (
              <View style={styles.textContainer}>
                <Text style={styles.title}>{t('welcome.title')}</Text>
                <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
              </View>
            )}

            {sent && (
              <View style={styles.textContainer}>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>Enter the code sent to {email}</Text>
              </View>
            )}
          </View>

          {/* Auth Form Section */}
          <View style={styles.formSection}>
            {!sent ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={t('signIn.email')}
                  placeholderTextColor={COLORS.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                {showInviteInput && (
                  <TextInput
                    style={styles.input}
                    placeholder="Invite code (Required for sign up)"
                    placeholderTextColor={COLORS.tertiary}
                    value={inviteCode}
                    onChangeText={(val: string) => setInviteCode(val.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                )}

                {/* Terms and Privacy Acceptance - Only show for new signups (when invite code is required) */}
                {showInviteInput && (
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

                          // Split by placeholders and create clickable links
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
                )}

                <Pressable
                  style={[styles.button, (!email.trim() || loading || (showInviteInput && !acceptedTerms)) && styles.buttonDisabled]}
                  onPress={handleSendLink}
                  disabled={!email.trim() || loading || (showInviteInput && !acceptedTerms)}
                >
                  <Text style={styles.buttonText}>
                    {loading ? t('common.loading') : 'Send verification code'}
                  </Text>
                </Pressable>

                <Pressable onPress={() => router.push('/waiting-list')}>
                  <Text style={styles.resendLink}>{t('signIn.joinWaitlist', 'Need an invite? Join the waitlist')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
                  placeholder="000000"
                  placeholderTextColor={COLORS.tertiary}
                  value={token}
                  onChangeText={(val: string) => setToken(val.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  autoFocus
                />

                <Pressable
                  style={[styles.button, (token.length < 6 || loading) && styles.buttonDisabled]}
                  onPress={handleVerify}
                  disabled={token.length < 6 || loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? t('signIn.verifying') : t('signIn.verify')}
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.buttonSecondary, (cooldown > 0 || loading) && styles.buttonDisabled]}
                  onPress={handleSendLink}
                  disabled={cooldown > 0 || loading}
                >
                  <Text style={styles.buttonTextSecondary}>
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                  </Text>
                </Pressable>

                <Pressable onPress={() => { setSent(false); setToken(''); setCooldown(0); }}>
                  <Text style={styles.resendLink}>Wrong email? Go back</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Legal Links - Fixed at bottom */}
        <View style={styles.legalLinks}>
          <Pressable onPress={() => openLegalLink('/privacy')}>
            <Text style={styles.legalLink}>{t('welcome.privacy')}</Text>
          </Pressable>
          <View style={styles.legalSeparator} />
          <Pressable onPress={() => openLegalLink('/terms')}>
            <Text style={styles.legalLink}>{t('welcome.terms')}</Text>
          </Pressable>
          <View style={styles.legalSeparator} />
          <Pressable onPress={() => openLegalLink('/imprint')}>
            <Text style={styles.legalLink}>{t('welcome.imprint')}</Text>
          </Pressable>
        </View>
      </View>

      {/* Intro Modal */}
      <IntroModal visible={showIntro} onClose={handleIntroClose} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  centeredContent: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
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
    gap: SPACING.m,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.paper,
    letterSpacing: -0.5,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
    fontFamily: FONTS.regular,
  },
  formSection: {
    gap: SPACING.l,
    width: '100%',
  },
  input: {
    height: 56,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  resendLink: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: FONTS.medium,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    paddingBottom: SPACING.l,
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
