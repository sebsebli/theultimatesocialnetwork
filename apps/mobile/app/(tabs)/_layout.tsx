import React from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, HEADER } from '../../constants/theme';
import { Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { useSocket } from '../../context/SocketContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading, onboardingComplete } = useAuth();
  const { unreadMessages } = useSocket();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.ink, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (onboardingComplete !== true) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.ink,
          height: 50 + insets.bottom,
          paddingTop: 5,
          paddingBottom: insets.bottom,
          paddingHorizontal: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.tertiary,
        tabBarShowLabel: false,
        tabBarIconStyle: { marginTop: 0 },
        tabBarItemStyle: { flex: 1, justifyContent: 'center', alignItems: 'center' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <MaterialIcons
              name="home"
              size={HEADER.iconSize}
              color={focused ? COLORS.primary : COLORS.tertiary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <MaterialIcons
              name="search"
              size={HEADER.iconSize}
              color={focused ? COLORS.primary : COLORS.tertiary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        listeners={() => ({
          tabPress: (e: any) => {
            e.preventDefault();
            router.push('/post/compose');
          },
        })}
        options={{
          title: '',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
              borderWidth: 4,
              borderColor: COLORS.ink,
            }}>
              <MaterialIcons
                name="edit"
                size={HEADER.iconSize}
                color={COLORS.ink}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <MaterialIcons
              name="chat-bubble-outline"
              size={HEADER.iconSize}
              color={focused ? COLORS.primary : COLORS.tertiary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <MaterialIcons
              name="person"
              size={HEADER.iconSize}
              color={focused ? COLORS.primary : COLORS.tertiary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
