import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.cyan,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        },
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopWidth: 2,
          borderTopColor: '#00f0ff44',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 10,
          shadowColor: Colors.cyan,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'DASHBOARD',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'apps' : 'apps-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'MARKET ALERTS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'analytics' : 'analytics-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'CONTROL PANEL',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'options' : 'options-outline'} 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
