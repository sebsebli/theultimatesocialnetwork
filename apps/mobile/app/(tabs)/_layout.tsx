import React, { useCallback, useMemo } from "react";
import { Tabs, Redirect, useRouter, usePathname } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { FullScreenSkeleton } from "../../components/LoadingSkeleton";
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/auth";
import { useSocket } from "../../context/SocketContext";
import { TabPressProvider, useTabPress } from "../../context/TabPressContext";
import { useExplorationTrail } from "../../context/ExplorationTrailContext";

type TabKey = "index" | "explore" | "messages" | "profile";

function getCurrentTab(pathname: string): TabKey {
  if (!pathname) return "index";
  if (pathname.includes("explore")) return "explore";
  if (pathname.includes("messages")) return "messages";
  if (pathname.includes("profile")) return "profile";
  return "index";
}

function TabLayoutInner() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, onboardingComplete } = useAuth();
  const { unreadMessages } = useSocket();
  const router = useRouter();
  const tabPress = useTabPress();
  const { clearTrail } = useExplorationTrail();
  const currentTab = useMemo(() => getCurrentTab(pathname ?? ""), [pathname]);

  const emitTabPress = tabPress?.emitTabPress ?? (() => { });
  const onTabPress = useCallback(
    (tab: TabKey) => {
      // Clear exploration trail when any tab is pressed
      clearTrail();
      if (currentTab === tab) emitTabPress(tab);
    },
    [currentTab, emitTabPress, clearTrail],
  );

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: COLORS.ink,
      height: 50 + insets.bottom,
      paddingTop: 5,
      paddingBottom: insets.bottom,
      paddingHorizontal: 0,
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderTopColor: COLORS.divider,
    }),
    [insets.bottom],
  );

  if (isLoading) {
    return <FullScreenSkeleton />;
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
        tabBarStyle,
        tabBarActiveTintColor: COLORS.paper,
        tabBarInactiveTintColor: COLORS.primary,
        tabBarShowLabel: false,
        tabBarIconStyle: { marginTop: 0 },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => onTabPress("index"),
        }}
        options={{
          title: "Home",
          tabBarIcon: ({
            color,
            focused,
          }: {
            color: string;
            focused: boolean;
          }) => (
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
        listeners={{
          tabPress: () => onTabPress("explore"),
        }}
        options={{
          title: "Discover",
          tabBarIcon: ({
            color,
            focused,
          }: {
            color: string;
            focused: boolean;
          }) => (
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
          tabPress: (e: { preventDefault: () => void }) => {
            e.preventDefault();
            router.push("/post/compose");
          },
        })}
        options={{
          title: "",
          tabBarButton: ({
            children: _children,
            ...props
          }: {
            children: React.ReactNode;
            style?: object;
            [key: string]: unknown;
          }) => (
            <Pressable
              {...props}
              style={[{ flex: 1 }, props.style]}
              accessibilityLabel="Compose new post"
              accessibilityRole="button"
            >
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    marginTop: -28,
                    borderRadius: 28,
                    backgroundColor: COLORS.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: COLORS.ink,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  <MaterialIcons name="add" size={26} color={COLORS.ink} />
                </View>
              </View>
            </Pressable>
          ),
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="messages"
        listeners={{
          tabPress: () => onTabPress("messages"),
        }}
        options={{
          title: "Chats",
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarIcon: ({
            color,
            focused,
          }: {
            color: string;
            focused: boolean;
          }) => (
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
        listeners={{
          tabPress: () => onTabPress("profile"),
        }}
        options={{
          title: "Profile",
          tabBarIcon: ({
            color,
            focused,
          }: {
            color: string;
            focused: boolean;
          }) => (
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

export default function TabLayout() {
  return (
    <TabPressProvider>
      <TabLayoutInner />
    </TabPressProvider>
  );
}
