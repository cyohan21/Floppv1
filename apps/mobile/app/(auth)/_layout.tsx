import { router, Stack } from "expo-router";
import { useAuth } from "../contexts/authContext"
import { useEffect} from 'react'
import { View, ActivityIndicator } from 'react-native'
import { VerifyProvider } from "../contexts/verifyContext"


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
    <VerifyProvider>
    <Stack screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="confirm-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
    </VerifyProvider>
  )
}