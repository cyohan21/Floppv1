# Mobile App Configuration

This guide explains how to configure the mobile app for different environments and custom deployments.

## Environment Variables

The mobile app uses environment variables to configure URLs, app names, and platform-specific settings. These are set during the build process and are not available at runtime.

### Required Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_NAME` | Display name of the app | `MyApp` |
| `APP_SLUG` | Expo app slug | `my-app` |
| `CUSTOM_URL_SCHEME` | Deep linking scheme | `myapp` |
| `API_BASE_URL` | Backend API endpoint | `https://api.example.com/api` |
| `WEB_BASE_URL` | Web app URL for deep links | `https://app.example.com` |
| `IOS_BUNDLE_ID` | iOS bundle identifier | `com.example.myapp` |
| `ANDROID_PACKAGE_NAME` | Android package name | `com.example.myapp` |
| `EAS_PROJECT_ID` | Expo Application Services project ID | `your-project-id` |
| `EXPO_OWNER` | Expo account owner | `your-expo-username` |

## Build Profiles

The app includes three build profiles with different configurations:

### Development
- Uses localhost URLs for API and web
- Custom URL scheme: `myapp-dev://`
- Development client enabled

### Preview (Staging)
- Uses staging URLs
- Custom URL scheme: `myapp-staging://`
- Internal distribution

### Production
- Uses production URLs
- Custom URL scheme: `myapp://`
- Auto-increment version

## Configuration Files

### `app.config.js`
Main configuration file that uses environment variables to set:
- App name and slug
- Custom URL schemes
- Platform-specific settings
- Associated domains

### `src/config/environment.ts`
Runtime configuration that loads from Expo Constants:
- API base URL
- Web base URL
- App name and custom schemes
- Development vs production flags

### `eas.json`
Build-time environment variables for different profiles.

## Customization

To customize the app for your own deployment:

1. **Update `env.example`** with your URLs and app details
2. **Modify `eas.json`** build profiles with your environment variables
3. **Update `app.config.js`** if you need additional configuration
4. **Set environment variables** when building:
   ```bash
   API_BASE_URL=https://your-api.com expo build:ios
   ```

## Development

For local development, the app automatically uses localhost URLs when `__DEV__` is true.

## Deep Linking

The app supports deep linking through:
- Custom URL schemes (e.g., `myapp://`)
- Universal links (iOS) and app links (Android)
- Web URLs that redirect to the app

Configure these in `app.config.js` and ensure your backend supports the same URL schemes. 