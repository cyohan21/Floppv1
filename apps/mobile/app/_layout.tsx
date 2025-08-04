import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "./contexts/authContext"
import { BankStatusProvider, useBankStatus } from "./contexts/bankStatusContext"
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import * as SplashScreen from "expo-splash-screen"
import { useEffect, useState } from "react";
import { View } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  fade: true
})
  

function AppContent() {
  const { loading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Set minimum time of 3 seconds to ensure everything is loaded
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only show app when both auth is complete AND minimum time has elapsed
    if (!loading && minTimeElapsed) {
      // Add a small buffer to ensure smooth transition
      const bufferTimer = setTimeout(() => {
        setAppIsReady(true);
      }, 200);

      return () => clearTimeout(bufferTimer);
    }
  }, [loading, minTimeElapsed]);

  useEffect(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(register)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(protected)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <BankStatusProvider>
      <AuthProviderWithBankStatus>
        <AppContent />
      </AuthProviderWithBankStatus>
    </BankStatusProvider>
  )
}

function AuthProviderWithBankStatus({ children }: { children: React.ReactNode }) {
  const { forceRefresh } = useBankStatus();
  
  return (
    <AuthProvider onLoginSuccess={forceRefresh}>
      {children}
    </AuthProvider>
  );
}