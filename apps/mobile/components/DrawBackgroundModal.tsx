import React, { useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  PanResponder,
  Modal,
  useWindowDimensions,
  type DimensionValue,
  type ColorValue,
  type TextStyle,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  COLORS,
  SPACING,
  PROFILE_HEADER_ASPECT_RATIO,
  HEADER,
  MODAL,
  FONTS,
  LAYOUT,
  SIZES,
  createStyles,
} from "../constants/theme";
import { api, getImageUrl, getAvatarUri } from "../utils/api";
import { useToast } from "../context/ToastContext";
import { ImageVerifyingOverlay } from "./ImageVerifyingOverlay";
import { InlineSkeleton } from "./LoadingSkeleton";
import { formatCompactNumber } from "../utils/format";

type Point = { x: number; y: number };
type Stroke = Point[];

const STROKE_WIDTH = 3;
/** Opaque background for saved PNG only (hidden capture layer) */
const DRAW_HEADER_BG = COLORS.ink;
/** Semi-transparent overlay so user sees profile below while drawing */
const OVERLAY_BG = "rgba(11,11,12,0.45)";
const STROKE_VISIBLE = COLORS.paper;

export interface DrawBackgroundModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called after save; pass key (and optionally url) so parent can update UI immediately */
  onSaved: (key: string, url?: string) => void;
  /** Current profile header image URL so user can see where they are drawing */
  profileHeaderUrl?: string | null;
  user?: { id?: string; handle?: string; displayName?: string; avatarKey?: string | null; avatarUrl?: string | null; followerCount?: number; followingCount?: number; postCount?: number; bio?: string } | null;
}

export function DrawBackgroundModal({
  visible,
  onClose,
  onSaved,
  profileHeaderUrl,
  user,
}: DrawBackgroundModalProps) {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const canvasWidth = screenWidth;
  const canvasHeight = Math.round(screenWidth / PROFILE_HEADER_ASPECT_RATIO);

  const canvasRef = useRef<View>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [saving, setSaving] = useState(false);

  const pathD = useCallback((stroke: Stroke) => {
    if (stroke.length < 2) return "";
    return stroke.reduce(
      (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
      "",
    );
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
    const allStrokes =
      currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
    if (allStrokes.length === 0) {
      showError(t("profile.drawEmpty", "Draw something first."));
      return;
    }
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const targetWidth = Math.round(screenWidth * 2);
      const targetHeight = Math.round(canvasHeight * 2);
      // Delay so SVG is fully painted before capture (view-shot can miss SVG otherwise)
      await new Promise((r) => setTimeout(r, 150));
      const result = await captureRef(canvasRef, {
        result: "tmpfile",
        format: "png",
        quality: 1,
        width: targetWidth,
        height: targetHeight,
      });
      const file = {
        uri: result as string,
        type: "image/png",
        fileName: "profile-header.png",
      };
      const uploadRes = await api.upload("/upload/profile-header", file);
      const uploadResult = uploadRes as { key?: string; url?: string } | null;
      if (uploadResult?.key) {
        await api.patch("/users/me", { profileHeaderKey: uploadResult.key });
        showSuccess(t("profile.headerUpdated", "Header updated."));
        onSaved(uploadResult.key, uploadResult.url);
        onClose();
      }
    } catch (e) {
      if (__DEV__) console.error(e);
      showError(t("profile.photoUpdateFailed", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }, [
    strokes,
    currentStroke,
    showError,
    showSuccess,
    t,
    onSaved,
    onClose,
    screenWidth,
    canvasHeight,
  ]);

  const allPaths = [...strokes, currentStroke].filter((s) => s.length >= 2);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <ImageVerifyingOverlay visible={saving} />
      <View style={styles.overlay}>
        {/* Backdrop only below the draw area: tap to close; top (draw area) stays transparent so profile shows through */}
        <Pressable
          style={[styles.backdropBelowCanvas, { top: canvasHeight }]}
          onPress={onClose}
          accessibilityLabel={t("common.close")}
        />
        {/* Draw area: same size/ratio as profile header; transparent so profile is visible behind */}
        <View
          style={[
            styles.canvasWrap,
            { width: canvasWidth, height: canvasHeight },
          ]}
        >
          {/* Ghost Profile Info (Visual Guide) - Rendered BEHIND drawing surface but visible through transparent stroke layer */}
          {user && (
            <View style={styles.ghostContent} pointerEvents="none">
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {getAvatarUri(user) ? (
                    <Image
                      source={{ uri: getAvatarUri(user)! }}
                      style={styles.avatarImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.displayName?.charAt(0) ||
                        user.handle?.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.identityBlock}>
                <Text style={styles.name}>{user.displayName}</Text>
                <Text style={styles.handle}>@{user.handle}</Text>
              </View>

              {user.bio ? (
                <Text style={styles.bio} numberOfLines={3}>
                  {user.bio}
                </Text>
              ) : null}

              {/* Placeholder for actions to match spacing */}
              <View style={styles.actionPlaceholder} />

              <View style={styles.followersFollowingRow}>
                <Text style={styles.followersFollowingText}>
                  {formatCompactNumber(user.followerCount ?? 0)}{" "}
                  {t("profile.followers").toLowerCase()}
                </Text>
                <Text style={styles.followersFollowingText}> · </Text>
                <Text style={styles.followersFollowingText}>
                  {formatCompactNumber(user.followingCount ?? 0)}{" "}
                  {t("profile.following").toLowerCase()}
                </Text>
              </View>
            </View>
          )}

          {/* Transparent background so profile header shows through; overlay + strokes on top */}
          <View
            style={[
              StyleSheet.absoluteFill,
              { width: canvasWidth, height: canvasHeight },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  width: canvasWidth,
                  height: canvasHeight,
                  backgroundColor: OVERLAY_BG,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <Svg
                width={canvasWidth}
                height={canvasHeight}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {allPaths.map((stroke, i) => (
                  <Path
                    key={i}
                    d={pathD(stroke)}
                    stroke={STROKE_VISIBLE}
                    strokeWidth={STROKE_WIDTH}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            </View>
          </View>
          {/* Hidden: for capture only (opaque bg + strokes so saved PNG is solid) */}
          <ViewShot
            ref={canvasRef}
            style={[
              styles.captureLayer,
              { width: canvasWidth, height: canvasHeight },
            ]}
            collapsable={false}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  width: canvasWidth,
                  height: canvasHeight,
                  backgroundColor: DRAW_HEADER_BG,
                },
              ]}
            />
            <Svg
              width={canvasWidth}
              height={canvasHeight}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            >
              {allPaths.map((stroke, i) => (
                <Path
                  key={i}
                  d={pathD(stroke)}
                  stroke={STROKE_VISIBLE}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </Svg>
          </ViewShot>
          <Pressable
            style={[styles.closeOverlay, { top: insets.top + SPACING.s }]}
            onPress={onClose}
            accessibilityLabel={t("common.close")}
          >
            <MaterialIcons
              name="close"
              size={HEADER.iconSize}
              color={COLORS.paper}
            />
          </Pressable>
        </View>
        {/* Bottom bar: Clear and Save */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom + SPACING.m },
          ]}
        >
          <Pressable
            style={styles.btnSecondary}
            onPress={clear}
            disabled={saving}
          >
            <MaterialIcons
              name="delete-outline"
              size={HEADER.iconSize}
              color={COLORS.paper}
            />
            <Text style={styles.btnSecondaryText}>
              {t("common.clear", "Clear")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.btnPrimary, saving && styles.btnDisabled]}
            onPress={save}
            disabled={saving}
          >
            {saving ? (
              <InlineSkeleton />
            ) : (
              <>
                <MaterialIcons
                  name="check"
                  size={HEADER.iconSize}
                  color={COLORS.ink}
                />
                <Text style={styles.btnPrimaryText}>
                  {t("profile.saveAsHeader", "Save")}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = createStyles({
  overlay: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "transparent",
  },
  /** Opaque below the draw area so ONLY the header-sized area is transparent; tap to close */
  backdropBelowCanvas: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.ink,
  },
  canvasWrap: {
    position: "relative",
    alignSelf: "stretch",
    backgroundColor: "transparent",
  },
  captureLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0,
    backgroundColor: "transparent",
  },
  closeOverlay: {
    position: "absolute",
    right: SPACING.l,
    padding: SPACING.s,
    zIndex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    backgroundColor: COLORS.ink,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.s,
    minHeight: MODAL.buttonMinHeight as DimensionValue,
    paddingVertical: MODAL.buttonPaddingVertical as DimensionValue,
    paddingHorizontal: MODAL.buttonPaddingHorizontal as DimensionValue,
    borderRadius: (MODAL.buttonBorderRadius as number) ?? 0,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  btnSecondaryText: {
    color: COLORS.paper,
    fontSize: MODAL.buttonFontSize as number,
    fontWeight: MODAL.buttonFontWeight as TextStyle["fontWeight"],
  },
  btnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.s,
    minHeight: MODAL.buttonMinHeight as DimensionValue,
    paddingVertical: MODAL.buttonPaddingVertical as DimensionValue,
    paddingHorizontal: MODAL.buttonPaddingHorizontal as DimensionValue,
    borderRadius: (MODAL.buttonBorderRadius as number) ?? 0,
    backgroundColor: MODAL.primaryButtonBackgroundColor as ColorValue,
  },
  btnPrimaryText: {
    color: MODAL.primaryButtonTextColor as ColorValue,
    fontSize: MODAL.buttonFontSize as number,
    fontWeight: MODAL.buttonFontWeight as TextStyle["fontWeight"],
  },
  btnDisabled: {
    opacity: 0.6,
  },
  ghostContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingBottom: SPACING.l,
    gap: SPACING.l,
    zIndex: 0, // Behind drawing strokes but visible
  },
  avatarContainer: {
    position: "relative",
    width: 120,
    height: 120,
    marginBottom: SPACING.xs,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.divider,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  identityBlock: {
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  handle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  bio: {
    fontSize: 15,
    color: COLORS.paper,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    fontFamily: FONTS.regular,
    opacity: 0.9,
  },
  actionPlaceholder: {
    height: 38,
    width: 120, // Approximate button width
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    opacity: 0.3, // Dim placeholder
    marginTop: SPACING.xs,
  },
  followersFollowingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  followersFollowingText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
