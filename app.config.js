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
// Firebase config (Android push). Kept out of git: EAS builds get it from the
// GOOGLE_SERVICES_JSON file variable, local builds from ./google-services.json.
// Optional, so Expo Go and the browser preview work without it.
const GOOGLE_SERVICES_FILE =
  process.env.GOOGLE_SERVICES_JSON ||
  (require("fs").existsSync("./google-services.json") ? "./google-services.json" : undefined);

// Android App Links: website links (emails, shares) open the app when it's
// installed. Only for a real https site, and only the paths the app has
// screens for (src/lib/appLinkPaths.json; see src/lib/appLinks.js). The site
// must serve /.well-known/assetlinks.json (the website build makes it).
const SITE_HOST = (() => {
  try {
    const url = new URL(process.env.EXPO_PUBLIC_SITE_URL || "");
    return url.protocol === "https:" && !/[<>]/.test(url.host) ? url.host : null;
  } catch {
    return null;
  }
})();
const APP_LINKS = SITE_HOST
  ? [
      {
        action: "VIEW",
        autoVerify: true,
        category: ["BROWSABLE", "DEFAULT"],
        data: require("./src/lib/appLinkPaths.json").map((p) => ({
          scheme: "https",
          host: SITE_HOST,
          ...p,
        })),
      },
    ]
  : [];

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
  // Expo account and project (from `eas init`). Builds and push notifications
  // use them. The project id is public: it ships inside the app.
  owner: "horror_98",
  extra: {
    eas: { projectId: "127ab7eb-f5a3-4085-8830-ba15cff95c31" },
  },
  android: {
    package: process.env.ANDROID_PACKAGE || "pk.libraryhub.app",
    ...(GOOGLE_SERVICES_FILE ? { googleServicesFile: GOOGLE_SERVICES_FILE } : {}),
    ...(APP_LINKS.length ? { intentFilters: APP_LINKS } : {}),
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
    // Push notifications (Android tray icon must be white on transparent).
    [
      "expo-notifications",
      {
        icon: "./assets/android-icon-monochrome.png",
        color: BRAND,
        defaultChannel: "default",
      },
    ],
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
