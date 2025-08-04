import { router, Stack } from "expo-router";
import { useAuth } from "../contexts/authContext"
import { useEffect} from 'react'
import { View, ActivityIndicator } from 'react-native'
import { RegisterProvider } from "../contexts/registerContext"


export default function RootLayout() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/(protected)/home')
    }
  }, [isAuthenticated, loading])

  if (loading) {
          return (
              <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                  <ActivityIndicator size="small" />
              </View>
          )
      }
  return (
    <RegisterProvider>
    <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="register-name" />
        <Stack.Screen name="register-email" />
        <Stack.Screen name="register-password" />
        <Stack.Screen name="register-otp" />
    </Stack>
    </RegisterProvider>
  )
}