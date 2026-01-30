import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export interface OptionItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface OptionsActionSheetProps {
  visible: boolean;
  title?: string;
  options: OptionItem[];
  cancelLabel?: string;
  onCancel: () => void;
}

/**
 * Bottom-sheet style action sheet. Replaces Alert for option menus (e.g. profile options).
 */
export function OptionsActionSheet({
  visible,
  title,
  options,
  cancelLabel = 'Cancel',
  onCancel,
}: OptionsActionSheetProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const handleOption = (onPress: () => void) => {
    onCancel();
    onPress();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {options.map((opt, i) => (
            <Pressable
              key={i}
              style={({ pressed }: { pressed: boolean }) => [
                styles.option,
                pressed && styles.optionPressed,
                opt.destructive && styles.optionDestructive,
              ]}
              onPress={() => handleOption(opt.onPress)}
            >
              <Text style={[styles.optionText, opt.destructive && styles.optionTextDestructive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.cancel, pressed && styles.optionPressed]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.ink,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tertiary,
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  title: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.s,
  },
  option: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    borderRadius: SIZES.borderRadius,
    marginBottom: 2,
  },
  optionPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  optionDestructive: {},
  optionText: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  optionTextDestructive: { color: COLORS.error },
  cancel: {
    paddingVertical: SPACING.m,
    marginTop: SPACING.s,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    fontFamily: FONTS.semiBold,
  },
});
