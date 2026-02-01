/** Shared type for Pressable style callback to avoid implicit any. */
import type { StyleProp, ViewStyle } from 'react-native';

export type PressableStyleState = { pressed: boolean };
export type PressableStyleCallback = (state: PressableStyleState) => StyleProp<ViewStyle>;
