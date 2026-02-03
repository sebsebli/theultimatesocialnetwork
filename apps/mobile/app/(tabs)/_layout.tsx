import React from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Text, View, ActivityIndicator, Pressable } from 'react-native';
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
          borderTopWidth: 1,
          borderTopColor: COLORS.divider,
        },
        tabBarActiveTintColor: COLORS.paper,
        tabBarInactiveTintColor: COLORS.primary,
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
              size={28}
              color={focused ? COLORS.paper : COLORS.primary}
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
              size={28}
              color={focused ? COLORS.paper : COLORS.primary}
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
          tabBarButton: ({ children: _children, ...props }: { children: React.ReactNode;[key: string]: unknown }) => (
            <Pressable {...props} style={[{ flex: 1 }, props.style]}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    marginTop: -28,
                    borderRadius: 28,
                    backgroundColor: COLORS.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  <MaterialIcons name="edit" size={26} color={COLORS.ink} />
                </View>
              </View>
            </Pressable>
          ),
          tabBarIcon: () => null,
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
              size={28}
              color={focused ? COLORS.paper : COLORS.primary}
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
              size={28}
              color={focused ? COLORS.paper : COLORS.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}
