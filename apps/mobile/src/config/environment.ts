import Constants from 'expo-constants';

// Get configuration from Expo Constants
const extra = Constants.expoConfig?.extra;

export const config = {
  // API Configuration
  apiBaseUrl: extra?.apiBaseUrl || "https://api.example.com/api",
  
  // Web Configuration
  webBaseUrl: extra?.webBaseUrl || "https://app.example.com",
  
  // App Configuration
  appName: extra?.appName || "MyApp",
  customUrlScheme: extra?.customUrlScheme || "myapp://",
  
  // Platform Configuration
  iosBundleId: extra?.iosBundleId || "com.example.myapp",
  androidPackageName: extra?.androidPackageName || "com.example.myapp",
  
  // Development Configuration
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
};

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  if (__DEV__) {
    return {
      ...config,
      apiBaseUrl: "http://localhost:3030/api", // Development API
      webBaseUrl: "http://localhost:8081", // Development web
    };
  }
  
  return config;
};

export default config; 