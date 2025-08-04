export default {
  expo: {
    name: process.env.APP_NAME || "MyApp",
    slug: process.env.APP_SLUG || "my-app",
    version: "1.0.0",
    orientation: "portrait",
    scheme: process.env.CUSTOM_URL_SCHEME || "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    icon: "./assets/images/icon.png",
    ios: {
      supportsTablet: true,
      icon: "./assets/images/icon.png",
      bundleIdentifier: process.env.IOS_BUNDLE_ID || "com.example.myapp",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: [`applinks:${process.env.WEB_BASE_URL || "app.example.com"}`]
    },
    android: {
      edgeToEdgeEnabled: true,
      package: process.env.ANDROID_PACKAGE_NAME || "com.example.myapp",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png"
      },
      intentFilters: [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "https",
              "host": process.env.WEB_BASE_URL || "app.example.com",
              "pathPrefix": "/"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      bundler: "metro",
      output: "static"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#512FCD"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "your-project-id"
      },
      // Environment-specific configuration
      apiBaseUrl: process.env.API_BASE_URL || "https://api.example.com/api",
      webBaseUrl: process.env.WEB_BASE_URL || "https://app.example.com",
      customUrlScheme: process.env.CUSTOM_URL_SCHEME || "myapp://",
      appName: process.env.APP_NAME || "MyApp",
    },
    owner: process.env.EXPO_OWNER || "your-expo-username"
  }
}; 