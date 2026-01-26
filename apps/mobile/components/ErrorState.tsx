import { StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SIZES } from '../constants/theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="error-outline" size={48} color={COLORS.error} />
      </View>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry && (
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.ink,
  },
  iconContainer: {
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  text: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
    maxWidth: 280,
  },
  button: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    fontWeight: '600',
  },
});
