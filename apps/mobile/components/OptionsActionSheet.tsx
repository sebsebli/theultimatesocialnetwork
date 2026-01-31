import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, MODAL, HEADER } from '../constants/theme';

export interface OptionItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  /** MaterialIcons name (e.g. 'settings', 'share', 'rss-feed') */
  icon?: string;
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
  const { height: windowHeight } = useWindowDimensions();
  const maxOptionsHeight = Math.min(windowHeight * 0.5, 320);

  if (!visible) return null;

  const handleOption = (onPress: () => void) => {
    onCancel();
    onPress();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <ScrollView
            style={[styles.optionsScroll, { maxHeight: maxOptionsHeight }]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
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
                {opt.icon ? (
                  <MaterialIcons
                    name={opt.icon as any}
                    size={HEADER.iconSize}
                    color={opt.destructive ? COLORS.error : COLORS.secondary}
                    style={styles.optionIcon}
                  />
                ) : null}
                <Text style={[styles.optionText, opt.destructive && styles.optionTextDestructive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [styles.cancel, pressed && styles.optionPressed]}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MODAL.backdropBackgroundColor,
  },
  sheet: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderTopLeftRadius: MODAL.sheetBorderRadius,
    borderTopRightRadius: MODAL.sheetBorderRadius,
    borderWidth: MODAL.sheetBorderWidth,
    borderBottomWidth: MODAL.sheetBorderBottomWidth,
    borderColor: MODAL.sheetBorderColor,
    paddingHorizontal: MODAL.sheetPaddingHorizontal,
    paddingTop: SPACING.m,
  },
  handle: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: 'center',
    marginTop: MODAL.handleMarginTop,
    marginBottom: MODAL.handleMarginBottom,
  },
  title: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.s,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: SIZES.borderRadius,
    marginBottom: 2,
  },
  optionIcon: {
    marginRight: SPACING.m,
  },
  optionsScroll: {},
  optionPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  optionDestructive: {},
  optionText: {
    fontSize: MODAL.buttonFontSize,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  optionTextDestructive: { color: COLORS.error },
  cancel: {
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    marginTop: SPACING.s,
    borderRadius: MODAL.buttonBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  cancelText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
    fontFamily: FONTS.semiBold,
  },
});
