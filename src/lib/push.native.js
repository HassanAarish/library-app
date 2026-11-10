import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Push notifications on the phone (expo-notifications, through Expo's push
 * service and Firebase on Android). The backend sends a push alongside every
 * reader notification; see its services/Push.Service.js.
 *
 * Push doesn't work in Expo Go (it needs a development build), so everything
 * here quietly does nothing there. The native module loads on first use, like
 * lib/socialAuth.native.js, so Expo Go doesn't crash at start-up.
 */

const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export const pushSupported = Boolean(projectId) && Constants.executionEnvironment !== "storeClient"; // storeClient = Expo Go

const lib = () => require("expo-notifications");

let handlerSet = false;
const setHandler = () => {
  if (handlerSet) return;
  handlerSet = true;
  // While the app is open the live pop-up (SocketProvider) already shows it,
  // so don't add a system banner on top. It still goes into the tray list.
  lib().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
};

/**
 * This phone's Expo push token, asking for permission if `ask` and it hasn't
 * been answered yet. null when push isn't possible or the user said no.
 * @returns {Promise<{ token: string, platform: "android" | "ios" } | null>}
 */
export const getPushToken = async ({ ask = true } = {}) => {
  if (!pushSupported) return null;
  try {
    const Notifications = lib();
    setHandler();

    // Android 13+: the channel must exist before asking, or no prompt appears.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "LibraryHub",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
    if (!granted && ask && canAskAgain) {
      ({ granted } = await Notifications.requestPermissionsAsync());
    }
    if (!granted) return null;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ? { token: data, platform: Platform.OS === "ios" ? "ios" : "android" } : null;
  } catch {
    // Emulator without Play services, no network, …: no push, nothing else breaks.
    return null;
  }
};

/**
 * Call `onOpen(data)` when the user taps a push, including the one that
 * launched the app. `data` is what the backend sent:
 * { notificationId, type, data }. Returns a function that stops listening.
 */
export const onPushOpened = (onOpen) => {
  if (!pushSupported) return () => {};
  try {
    const Notifications = lib();
    setHandler();

    const handle = (response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.type) onOpen(data);
    };

    const launch = Notifications.getLastNotificationResponse?.();
    if (launch) {
      Notifications.clearLastNotificationResponse?.();
      handle(launch);
    }

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  } catch {
    return () => {};
  }
};
