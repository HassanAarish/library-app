import { FACEBOOK_APP_ID, GOOGLE_WEB_CLIENT_ID } from "@/constants";

/**
 * Google and Facebook sign-in on the phone. Each returns the token the
 * backend's POST /auth/social verifies, or null if the user cancelled.
 *
 * Google is given the WEB client id, so its token is issued for the same
 * audience the backend already checks (GOOGLE_CLIENT_ID).
 *
 * The native modules load on first use: they don't exist in Expo Go, and a
 * top-level import would crash the app at start-up there.
 */
export const socialProviders = {
  google: Boolean(GOOGLE_WEB_CLIENT_ID),
  facebook: Boolean(FACEBOOK_APP_ID),
};

const google = () => {
  const lib = require("@react-native-google-signin/google-signin");
  lib.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  return lib;
};

export const googleToken = async () => {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    return isSuccessResponse(response) ? response.data.idToken : null;
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return null;
    throw err;
  }
};

export const facebookToken = async () => {
  const { AccessToken, LoginManager } = require("react-native-fbsdk-next");
  const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
  if (result.isCancelled) return null;
  const data = await AccessToken.getCurrentAccessToken();
  return data?.accessToken?.toString() ?? null;
};

/** On sign-out, forget the provider session so the next sign-in can pick another account. */
export const clearSocialSessions = async () => {
  try {
    if (socialProviders.google) await google().GoogleSignin.signOut();
  } catch {
    // not signed in with Google, or the module isn't in this build
  }
  try {
    if (socialProviders.facebook) require("react-native-fbsdk-next").LoginManager.logOut();
  } catch {
    // same for Facebook
  }
};
