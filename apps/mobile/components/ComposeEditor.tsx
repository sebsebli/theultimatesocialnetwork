import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export function ComposeEditor() {
  const router = useRouter();
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleBlur = () => {
    if (!body.trim()) {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <View style={styles.container}>
        <Pressable
          onPress={() => router.push('/(tabs)/compose')}
          style={styles.collapsedButton}
        >
          <View style={styles.collapsedContent}>
            <MaterialIcons name="edit" size={20} color={COLORS.tertiary} />
            <Text style={styles.collapsedText}>{t('compose.placeholder')}</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.expandedContent}>
        <TextInput
          value={body}
          onChangeText={setBody}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={t('compose.placeholder')}
          placeholderTextColor={COLORS.secondary}
          style={styles.textInput}
          multiline
          autoFocus
        />
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/(tabs)/compose')}
            disabled={!body.trim()}
            style={[styles.continueButton, !body.trim() && styles.continueButtonDisabled]}
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    padding: SPACING.l, // p-4
  },
  collapsedButton: {
    width: '100%',
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  collapsedText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  expandedContent: {
    gap: SPACING.l,
  },
  textInput: {
    width: '100%',
    backgroundColor: 'transparent',
    fontSize: 18,
    color: COLORS.paper,
    minHeight: 120,
    fontFamily: FONTS.regular,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  continueButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
});
