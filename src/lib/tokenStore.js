import * as SecureStore from "expo-secure-store";
import { TOKEN_KEY } from "@/constants";

/**
 * The access token, kept encrypted in the phone's keystore (expo-secure-store)
 * and mirrored in memory so every request can read it synchronously.
 * `load()` runs once at start-up, before the first API call.
 */
let token = null;

export const tokenStore = {
  get: () => token,

  load: async () => {
    try {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      token = null; // keystore unavailable: start signed out
    }
    return token;
  },

  set: async (next) => {
    token = next || null;
    try {
      if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // keep the in-memory copy for this session
    }
  },
};
