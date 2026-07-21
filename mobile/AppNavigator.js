import React, { useState, useEffect, useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS as DEFAULT_COLORS, FONTS, setGlobalTheme } from "./src/theme";
import { getBabyProfile, clearAllData } from "./src/storage";
import { cancelAllNotifications } from "./src/storage/remindersStorage";

import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import StatsScreen from "./src/screens/StatsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import GrowthScreen from "./src/screens/GrowthScreen";
import RemindersScreen from "./src/screens/RemindersScreen";
import AuthScreen from "./src/screens/AuthScreen";
import ChatScreen from "./src/screens/ChatScreen";
import SplashScreen from "./src/screens/SplashScreen";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";


import { AuthContext } from "./src/context/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home: require('./assets/icons/icon_home.jpg'),
  History: require('./assets/icons/icon_history.jpg'),
  Growth: require('./assets/icons/icon_growth.jpg'),
  Reminders: require('./assets/icons/icon_reminders.jpg'),
  Stats: require('./assets/icons/icon_stats.jpg'),
  Profile: require('./assets/icons/icon_profile.jpg'),
};

const tabIcon = (name, focused, activeColor) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: focused ? activeColor : "transparent",
    }}
  >
    <Image 
      source={TAB_ICONS[name]} 
      style={{ width: 28, height: 28, opacity: focused ? 1 : 0.5 }} 
      resizeMode="contain" 
    />
  </View>
);

const HomeTabs = ({ route }) => {
  const { colors } = route.params || { colors: DEFAULT_COLORS };
  const insets = useSafeAreaInsets();
  // Use the device's real bottom inset (gesture bar / 3-button nav / home
  // indicator) instead of a guessed constant, so the tab bar never ends up
  // underneath the system's own navigation buttons.
  const tabBarBottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12);
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 8,
          height: 56 + tabBarBottomPadding,
          paddingBottom: tabBarBottomPadding,
        },
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => tabIcon("Home", focused, colors.primaryLight) }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: ({ focused }) => tabIcon("History", focused, colors.primaryLight) }} />
      <Tab.Screen name="Growth" component={GrowthScreen} options={{ tabBarIcon: ({ focused }) => tabIcon("Growth", focused, colors.primaryLight) }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ tabBarIcon: ({ focused }) => tabIcon("Reminders", focused, colors.primaryLight) }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ tabBarIcon: ({ focused }) => tabIcon("Stats", focused, colors.primaryLight) }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => tabIcon("Profile", focused, colors.primaryLight) }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check for existing auth token OR guest mode flag
        const token = await AsyncStorage.getItem('auth_token');
        const isGuest = await AsyncStorage.getItem('guest_mode');
        
        if (token || isGuest === 'true') {
          // Already logged in or in guest mode — go straight to app
          setIsLoggedIn(true);
        }
        // else: isLoggedIn stays false → shows Splash → RoleSelection flow

        const profile = await getBabyProfile();
        if (profile && profile.gender) {
          setGender(profile.gender);
          setGlobalTheme(profile.gender);
        }
      } catch (e) {
        console.warn('initApp error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const authContext = useMemo(() => ({
    logout: async () => {
      try {
        await AsyncStorage.removeItem('guest_mode');
        await AsyncStorage.removeItem('auth_token');
        await clearAllData();
        await cancelAllNotifications();
        await AsyncStorage.removeItem('baby_reminders');
      } catch (err) {
        console.warn("Logout cleanup error:", err);
      }
      setGender(null);
      setGlobalTheme(null);
      setIsLoggedIn(false);
    },
    updateGender: (newGender) => {
      setGender(newGender);
      setGlobalTheme(newGender);
    },
    setGuestMode: async () => {
      await AsyncStorage.setItem('guest_mode', 'true');
      setIsLoggedIn(true);
    },
  }), []);

  const colors = DEFAULT_COLORS;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFAF8', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={require('./assets/babybloom_logo.png')}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer key={gender}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: FONTS.sizes.lg,
            color: colors.textPrimary,
          },
          headerBackTitleVisible: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen
              name="Splash"
              options={{ headerShown: false }}
            >
              {(props) => <SplashScreen {...props} />}
            </Stack.Screen>
            <Stack.Screen
              name="RoleSelection"
              options={{ headerShown: false }}
            >
              {(props) => <RoleSelectionScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
            <Stack.Screen name="Auth" options={{ headerShown: false }}>
              {(props) => <AuthScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={HomeTabs}
              options={{ headerShown: false }}
              initialParams={{ colors }}
            />
            <Stack.Screen
              name="AddEntry"
              component={AddEntryScreen}
              options={({ route }) => {
                const { TASK_CONFIG } = require("./src/theme");
                const config = TASK_CONFIG[route.params?.type] || {};
                return {
                  title: `Log ${config.label || "Entry"}`,
                  headerStyle: {
                    backgroundColor: config.lightBg || colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                };
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default AppNavigator;
