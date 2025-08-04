import { router, Tabs } from "expo-router";
import { useAuth } from "../contexts/authContext"
import { useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RootLayout() {
    const {isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/(auth)/login')
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
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6a12e4ff', // Purple color for selected tab
      tabBarInactiveTintColor: '#999', // Gray color for unselected tabs
    }}>
  <Tabs.Screen
    name="home/index"
    options={{
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons name="home" color={color} size={size} />
      ),
      tabBarLabel: () => null, // Hide label
    }}
  />
  <Tabs.Screen
    name="swipe/swipeCard"
    options={{
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons name="gesture-swipe" color={color} size={size} />
      ),
      tabBarLabel: () => null,
    }}
  />
  <Tabs.Screen
    name="analytics/chart"
    options={{
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons name="chart-bar" color={color} size={size} />
      ),
      tabBarLabel: () => null,
    }}
  />
  <Tabs.Screen
    name="settings/main"
    options={{
      tabBarIcon: ({ color, size }) => (
        <MaterialCommunityIcons name="cog" color={color} size={size} />
      ),
      tabBarLabel: () => null,
    }}
    />
    </Tabs>
  )
}