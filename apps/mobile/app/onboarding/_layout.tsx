import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.ink },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="languages" />
      <Stack.Screen name="starter-packs" />
    </Stack>
  );
}
