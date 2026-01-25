import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { api } from '../utils/api';
import { useAuth } from '../context/auth';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export default function SignInScreen() {
  console.log('SignInScreen mounting...');
  const router = useRouter();
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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

    setLoading(true);
    try {
      await api.post('/auth/login', { 
        email: sanitizedEmail,
        inviteCode: showInviteInput ? (inviteCode.trim() || undefined) : undefined
      });
      setSent(true);
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
        Alert.alert('Too Many Requests', 'Please wait 60 seconds before requesting another code.');
        setLoading(false);
        return;
      }

      // Don't log sensitive errors in production
      if (__DEV__) {
        console.error('Failed to send magic link', error);
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

    // Validate token format
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
      // Don't log sensitive errors in production
      if (__DEV__) {
        console.error('Failed to verify', error);
      }
      const errorMessage = error?.status === 401 
        ? t('signIn.invalid') || 'Invalid token'
        : t('signIn.error') || 'An error occurred';
      Alert.alert(t('signIn.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{t('signIn.title')}</Text>

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
              autoFocus
            />

            {showInviteInput && (
              <TextInput
                style={styles.input}
                placeholder="Invite code (Required for sign up)"
                placeholderTextColor={COLORS.tertiary}
                value={inviteCode}
                onChangeText={(val) => setInviteCode(val.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            )}

            <Pressable
              style={[styles.button, (!email.trim() || loading) && styles.buttonDisabled]}
              onPress={handleSendLink}
              disabled={!email.trim() || loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t('common.loading') : 'Send verification code'}
              </Text>
            </Pressable>

            <Pressable onPress={() => router.push('/waiting-list')}>
              <Text style={styles.resendLink}>{t('signIn.joinWaitlist', 'Need an invite? Join the waitlist')}</Text>
            </Pressable>

            <Text style={styles.termsText}>
              By signing in, you agree to our{' '}
              <Text style={styles.linkText} onPress={() => openLink('https://cite.app/terms')}>{t('welcome.terms')}</Text>
              {' '}and{' '}
              <Text style={styles.linkText} onPress={() => openLink('https://cite.app/privacy')}>{t('welcome.privacy')}</Text>.
            </Text>
          </>
        ) : (
          <View style={styles.sentContainer}>
            <Text style={styles.sentText}>
              Enter the verification code sent to {email}
            </Text>
            
            <TextInput
              style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}
              placeholder="000000"
              placeholderTextColor={COLORS.tertiary}
              value={token}
              onChangeText={(val) => setToken(val.replace(/\D/g, '').slice(0, 6))}
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

            <Pressable onPress={() => setSent(false)}>
              <Text style={styles.resendLink}>{t('signIn.changeEmail')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 80,
    gap: SPACING.xxl,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  input: {
    height: 56,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    fontSize: 17,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  sentContainer: {
    gap: SPACING.l,
  },
  sentText: {
    fontSize: 17,
    color: COLORS.secondary,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  resendLink: {
    fontSize: 15,
    color: COLORS.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: SPACING.s,
    fontFamily: FONTS.medium,
  },
  termsText: {
    fontSize: 13,
    color: COLORS.tertiary,
    textAlign: 'center',
    marginTop: SPACING.l,
    lineHeight: 20,
    fontFamily: FONTS.regular,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
});
