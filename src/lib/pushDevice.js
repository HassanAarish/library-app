import { notifications } from "@/lib/api";

/**
 * Which push token this phone registered with the backend, so sign-out can
 * remove it again. Lives in memory: the app registers again on every start.
 */
let registered = null;

export const pushDevice = {
  /** Tell the backend to push to this phone for the signed-in reader. */
  register: async ({ token, platform }) => {
    await notifications.registerDevice({ token, platform });
    registered = token;
  },

  /** The account was closed: the server already removed the phone. */
  forget: () => {
    registered = null;
  },

  /**
   * Stop pushes to this phone. Call before the session token is cleared.
   * Forgets the token first, so a 401 that signs out again can't loop, and
   * gives up after a few seconds so sign-out never hangs.
   */
  unregister: async () => {
    const token = registered;
    registered = null;
    if (!token) return;
    let timer;
    await Promise.race([
      notifications.unregisterDevice(token).catch(() => {}),
      new Promise((resolve) => {
        timer = setTimeout(resolve, 3000);
      }),
    ]);
    clearTimeout(timer);
  },
};
