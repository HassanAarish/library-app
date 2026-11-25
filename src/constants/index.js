import Constants from "expo-constants";

/**
 * Backend address. Set EXPO_PUBLIC_API_URL per build (see .env.example).
 *
 * In development, when it isn't set, the app talks to the backend on the same
 * computer as the Expo dev server (port 5001). The phone can't use
 * "localhost" (that's the phone itself), so this uses the dev server's network
 * address, e.g. http://192.168.1.20:5001.
 */
const devHost = Constants.expoConfig?.hostUri?.split(":")[0];

export const baseURL = (
  process.env.EXPO_PUBLIC_API_URL || (devHost ? `http://${devHost}:5001` : "http://localhost:5001")
).replace(/\/$/, "");

// Socket.IO runs on the same host and port as the API.
export const socketURL = (process.env.EXPO_PUBLIC_SOCKET_URL || baseURL).replace(/\/$/, "");

// The website, for things the app sends people to (legal pages, account
// deletion, renting; payments stay on the web, see README). No guessed
// default: links to the website are hidden until it's set.
const site = process.env.EXPO_PUBLIC_SITE_URL || "";
// The .env.example placeholder (https://<your-domain>) counts as not set.
export const siteURL = /^https?:\/\/[^<\s]+$/.test(site) ? site.replace(/\/$/, "") : "";

// Public social sign-in identifiers. The Google one is the WEB client id, the
// same value as the backend's GOOGLE_CLIENT_ID. Empty hides the button.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "";

// Where the access token is kept (expo-secure-store key).
export const TOKEN_KEY = "token";
