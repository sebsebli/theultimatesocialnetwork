import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  PanResponder,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, SIZES, PROFILE_TOP_HEIGHT, HEADER, MODAL } from '../constants/theme';
import { api } from '../utils/api';
import { useToast } from '../context/ToastContext';

type Point = { x: number; y: number };
type Stroke = Point[];

const STROKE_WIDTH = 3;
/** Marker/stroke color: app grey (primary steel) so it matches the design, not white */
const STROKE_COLOR = COLORS.primary;
/** Semi-transparent so the profile shows through the drawing header area */
const DRAW_HEADER_BG = 'rgba(11, 11, 12, 0.3)';

export interface DrawBackgroundModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DrawBackgroundModal({ visible, onClose, onSaved }: DrawBackgroundModalProps) {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = screenWidth;
  const canvasHeight = PROFILE_TOP_HEIGHT;

  const canvasRef = useRef<View>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [saving, setSaving] = useState(false);

  const pathD = useCallback((stroke: Stroke) => {
    if (stroke.length < 2) return '';
    return stroke.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentStroke((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setCurrentStroke((prev) => {
          if (prev.length > 0) setStrokes((s) => [...s, prev]);
          return [];
        });
      },
    }),
  ).current;

  const clear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
  }, []);

  const save = useCallback(async () => {
    const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
    if (allStrokes.length === 0) {
      showError(t('profile.drawEmpty', 'Draw something first.'));
      return;
    }
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const targetWidth = Math.round(screenWidth * 2);
      const targetHeight = Math.round(PROFILE_TOP_HEIGHT * 2);
      const result = await captureRef(canvasRef, {
        result: 'tmpfile',
        format: 'png',
        quality: 1,
        width: targetWidth,
        height: targetHeight,
      });
      const file = {
        uri: result as string,
        type: 'image/png',
        fileName: 'profile-header.png',
      };
      const uploadRes = await api.upload('/upload/profile-header', file);
      if (uploadRes?.key) {
        await api.patch('/users/me', { profileHeaderKey: uploadRes.key });
        showSuccess(t('profile.headerUpdated', 'Header updated.'));
        onSaved();
        onClose();
      }
    } catch (e) {
      if (__DEV__) console.error(e);
      showError(t('profile.photoUpdateFailed', 'Failed to save.'));
    } finally {
      setSaving(false);
    }
  }, [strokes, currentStroke, showError, showSuccess, t, onSaved, onClose, screenWidth]);

  const allPaths = [...strokes, currentStroke].filter((s) => s.length >= 2);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Dimmed backdrop like other modals */}
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
        {/* Draw area: exact same rect as profile top section (screenWidth × PROFILE_TOP_HEIGHT) so drawing overlays where the image will show */}
        <View style={[styles.canvasWrap, { width: canvasWidth, height: canvasHeight }]}>
          <View
            ref={canvasRef}
            style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}
            collapsable={false}
            {...panResponder.panHandlers}
          >
            <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
              <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill={DRAW_HEADER_BG} />
              {allPaths.map((stroke, i) => (
                <Path
                  key={i}
                  d={pathD(stroke)}
                  stroke={STROKE_COLOR}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
          </View>
          <Pressable
            style={[styles.closeOverlay, { top: insets.top + SPACING.s }]}
            onPress={onClose}
            accessibilityLabel={t('common.close')}
          >
            <MaterialIcons name="close" size={HEADER.iconSize} color={COLORS.paper} />
          </Pressable>
        </View>
        {/* Lower part: fully opaque (no transparency), only the drawable area above is the canvas */}
        <View style={styles.lowerPanel}>
          <View style={[styles.card, { paddingBottom: insets.bottom + SPACING.xl }]}>
            <View style={styles.handle} />
            <View style={styles.actions}>
            <Pressable style={styles.btnSecondary} onPress={clear} disabled={saving}>
              <MaterialIcons name="delete-outline" size={HEADER.iconSize} color={COLORS.paper} />
              <Text style={styles.btnSecondaryText}>{t('common.clear', 'Clear')}</Text>
            </Pressable>
            <Pressable
              style={[styles.btnPrimary, saving && styles.btnDisabled]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.ink} size="small" />
              ) : (
                <>
                  <MaterialIcons name="check" size={HEADER.iconSize} color={COLORS.ink} />
                  <Text style={styles.btnPrimaryText}>{t('profile.saveAsHeader', 'Save')}</Text>
                </>
              )}
            </Pressable>
          </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MODAL.backdropBackgroundColor,
  },
  canvasWrap: {
    position: 'relative',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  canvas: {
    backgroundColor: DRAW_HEADER_BG,
  },
  closeOverlay: {
    position: 'absolute',
    right: SPACING.l,
    padding: SPACING.s,
    zIndex: 1,
  },
  lowerPanel: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  card: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: MODAL.sheetBorderRadius,
    borderTopRightRadius: MODAL.sheetBorderRadius,
    borderWidth: MODAL.sheetBorderWidth,
    borderBottomWidth: MODAL.sheetBorderBottomWidth,
    borderColor: MODAL.sheetBorderColor,
    paddingHorizontal: MODAL.sheetPaddingHorizontal,
    paddingTop: MODAL.sheetPaddingTop,
    overflow: 'hidden',
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
  actions: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: MODAL.buttonBorderRadius,
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  btnSecondaryText: {
    color: MODAL.secondaryButtonTextColor,
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
  },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    borderRadius: MODAL.buttonBorderRadius,
    backgroundColor: MODAL.primaryButtonBackgroundColor,
  },
  btnPrimaryText: {
    color: MODAL.primaryButtonTextColor,
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
