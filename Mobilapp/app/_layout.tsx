// app/_layout.tsx
import React, { useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

const BG = "#0b1323"; // ugyanaz a szín, mint app.json splash background

// ✅ ne tűnjön el automatikusan
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const hideSplash = useCallback(async () => {
    // ✅ “kitartás” (pl. 900ms)
    await new Promise((r) => setTimeout(r, 900));
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    // amikor a layout betöltött, akkor engedjük el később
    hideSplash();
  }, [hideSplash]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <StatusBar style="light" backgroundColor={BG} translucent={false} />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}