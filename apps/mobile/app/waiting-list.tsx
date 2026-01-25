import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export default function WaitingListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('waitingList.title', 'Join Waiting List')}</Text>
        <View style={styles.placeholder} />
      </View>

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

        <Pressable
          style={[styles.button, (!email.trim() || loading) && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={!email.trim() || loading}
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
    </KeyboardAvoidingView>
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
    paddingTop: SPACING.header + 10,
    paddingBottom: SPACING.m,
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: SPACING.xxxl,
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
});
