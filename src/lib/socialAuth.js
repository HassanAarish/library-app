/**
 * Browser preview only (`npm run web`): the Google and Facebook SDKs used on
 * phones are native, so these buttons are hidden there. See socialAuth.native.js.
 */
export const socialProviders = { google: false, facebook: false };
export const googleToken = async () => null;
export const facebookToken = async () => null;
export const clearSocialSessions = async () => {};
