import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS } from '../../constants/theme';
import { Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading } = useAuth();

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
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.ink,
          borderTopColor: COLORS.divider,
          borderTopWidth: 1,
          height: 50 + insets.bottom, // Reduced height
          paddingTop: 5,
          paddingBottom: insets.bottom,
          paddingHorizontal: SPACING.xxl,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.tertiary,
        tabBarShowLabel: false, // Remove labels as requested
        tabBarIconStyle: {
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="home" 
              size={24} 
              color={focused ? COLORS.primary : COLORS.tertiary} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name="compass-outline" 
              size={24} 
              color={focused ? COLORS.primary : COLORS.tertiary} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: '',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: COLORS.hover,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MaterialIcons 
                name="edit" 
                size={24} 
                color={COLORS.paper} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons 
              name="notifications-none" 
              size={24} 
              color={focused ? COLORS.primary : COLORS.tertiary} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(110, 122, 138, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{
                fontSize: 10,
                fontWeight: '600',
                color: COLORS.primary,
                fontFamily: FONTS.semiBold,
              }}>D</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
