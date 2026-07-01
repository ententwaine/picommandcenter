import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { EsiProvider } from '@/context/EsiContext';
import { Colors } from '@/constants/theme';

// Prevent splash screen from auto-hiding until assets/fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen immediately as we load our theme styling
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: Colors.bgDark }}>
      <EsiProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="planet/[id]" />
        </Stack>
      </EsiProvider>
    </SafeAreaProvider>
  );
}
