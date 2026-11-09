/**
 * Expo app config (replaces app.json so values can come from env).
 * Native folders (android/) are generated from this at build time — never
 * edit them by hand; configure here and through config plugins.
 *
 * ANDROID_PACKAGE is permanent once the app is on Google Play. It defaults to
 * pk.libraryhub.app; confirm it (ideally a domain you own, reversed) before
 * the first Play upload.
 */
const { version } = require("./package.json");

const CANVAS_LIGHT = "#fbf8f3";
const CANVAS_DARK = "#14110e";
const BRAND = "#1f5c4a";
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const FACEBOOK_CLIENT_TOKEN = process.env.FACEBOOK_CLIENT_TOKEN;

module.exports = () => ({
  name: "LibraryHub",
  slug: "libraryhub",
  scheme: "libraryhub", // deep links: libraryhub://books/123
  // The version people see ("0.1.0") comes from package.json, so a release
  // bumps it in one place (see CONTRIBUTING.md). Android's internal build
  // number (versionCode) is kept by Expo's servers and goes up on every
  // production build (eas.json: appVersionSource "remote", autoIncrement).
  version,
  orientation: "portrait",
  userInterfaceStyle: "automatic", // follow the phone's light/dark setting
  icon: "./assets/icon.png",
  android: {
    package: process.env.ANDROID_PACKAGE || "pk.libraryhub.app",
    adaptiveIcon: {
      backgroundColor: BRAND,
      foregroundImage: "./assets/android-icon-foreground.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 120,
        resizeMode: "contain",
        backgroundColor: CANVAS_LIGHT,
        dark: { image: "./assets/splash-icon.png", backgroundColor: CANVAS_DARK },
      },
    ],
    // The plugin requires iosUrlScheme; the app is Android-only for now.
    [
      "@react-native-google-signin/google-signin",
      { iosUrlScheme: "com.googleusercontent.apps.android-only" },
    ],
    // Only when configured: the Facebook plugin fails without its ids.
    ...(FACEBOOK_APP_ID && FACEBOOK_CLIENT_TOKEN
      ? [
          [
            "react-native-fbsdk-next",
            {
              appID: FACEBOOK_APP_ID,
              clientToken: FACEBOOK_CLIENT_TOKEN,
              displayName: "LibraryHub",
              scheme: `fb${FACEBOOK_APP_ID}`,
            },
          ],
        ]
      : []),
  ],
});
