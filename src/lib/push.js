/**
 * Browser preview only (`npm run web`): push notifications are for the phone
 * app. See push.native.js.
 */
export const pushSupported = false;
export const getPushToken = async () => null;
export const pushPermission = async () => "unsupported";
export const onPushOpened = () => () => {};
