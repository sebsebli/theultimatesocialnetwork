import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="new" 
        options={{ 
          presentation: 'card',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="[threadId]" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
