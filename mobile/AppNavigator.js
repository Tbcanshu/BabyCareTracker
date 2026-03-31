import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View } from "react-native";
import { COLORS, FONTS } from "./src/theme";

import HomeScreen from "./src/screens/HomeScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import StatsScreen from "./src/screens/StatsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AddEntryScreen from "./src/screens/AddEntryScreen";
import GrowthScreen from "./src/screens/GrowthScreen";
import RemindersScreen from "./src/screens/RemindersScreen"; // ← NEW

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const tabIcon = (emoji, focused) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: focused ? COLORS.primaryLight : "transparent",
    }}
  >
    <Text style={{ fontSize: 18 }}>{emoji}</Text>
  </View>
);

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 64,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarActiveTintColor: COLORS.primaryDark,
      tabBarInactiveTintColor: COLORS.textLight,
      tabBarLabelStyle: {
        fontSize: 9,
        fontWeight: "600",
        marginTop: -2,
      },
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ focused }) => tabIcon("🏠", focused),
        tabBarLabel: "Home",
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarIcon: ({ focused }) => tabIcon("📋", focused),
        tabBarLabel: "History",
      }}
    />
    <Tab.Screen
      name="Growth"
      component={GrowthScreen}
      options={{
        tabBarIcon: ({ focused }) => tabIcon("📸", focused),
        tabBarLabel: "Growth",
      }}
    />
    <Tab.Screen
      name="Reminders"
      component={RemindersScreen}
      options={{
        tabBarIcon: ({ focused }) => tabIcon("🔔", focused),
        tabBarLabel: "Reminders",
      }}
    />
    <Tab.Screen
      name="Stats"
      component={StatsScreen}
      options={{
        tabBarIcon: ({ focused }) => tabIcon("📊", focused),
        tabBarLabel: "Stats",
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ focused }) => tabIcon("👶", focused),
        tabBarLabel: "Profile",
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: FONTS.sizes.lg,
          color: COLORS.textPrimary,
        },
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="Main"
        component={HomeTabs}
        options={{ headerShown: false }}
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
              backgroundColor: config.lightBg || COLORS.surface,
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            },
          };
        }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
