import React, { useState, useEffect, useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, Image, Platform } from "react-native";
import { COLORS as DEFAULT_COLORS, FONTS, setGlobalTheme } from "./src/theme";
import { getBabyProfile } from "./src/storage";

import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import StatsScreen from "./src/screens/StatsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import GrowthScreen from "./src/screens/GrowthScreen";
import RemindersScreen from "./src/screens/RemindersScreen";
import AuthScreen from "./src/screens/AuthScreen";
import ChatScreen from "./src/screens/ChatScreen";


export const AuthContext = React.createContext();

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TAB_ICONS = {
  Home: require('./assets/icons/icon_home.png'),
  History: require('./assets/icons/icon_history.png'),
  Growth: require('./assets/icons/icon_growth.png'),
  Reminders: require('./assets/icons/icon_reminders.png'),
  Stats: require('./assets/icons/icon_stats.png'),
  Profile: require('./assets/icons/icon_profile.png'),
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
          height: Platform.OS === 'ios' ? 90 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
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
      setIsLoggedIn(true);
      const profile = await getBabyProfile();
      if (profile && profile.gender) {
        setGender(profile.gender);
        setGlobalTheme(profile.gender);
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  const authContext = useMemo(() => ({
    logout: () => setIsLoggedIn(false),
    updateGender: (newGender) => {
      setGender(newGender);
      setGlobalTheme(newGender);
    },
  }), []);

  const colors = DEFAULT_COLORS;

  if (isLoading) {
    return <View style={{flex: 1, backgroundColor: colors.background}} />;
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
          <Stack.Screen name="Auth" options={{ headerShown: false }}>
            {(props) => <AuthScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
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
