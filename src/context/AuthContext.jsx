import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { user as userApi } from "@/lib/api";
import { setUnauthorizedHandler } from "@/lib/http";
import { clearSocialSessions } from "@/lib/socialAuth";
import { tokenStore } from "@/lib/tokenStore";

/**
 * Who is signed in (ported from the website's AuthContext). The token lives
 * in SecureStore; on start-up the profile is loaded from the backend, which is
 * the source of truth for the role.
 *
 * status: "loading" (restoring a saved token) | "guest" | "authenticated"
 *         | "offline" (a saved token, but the server couldn't be reached:
 *           keep the session and let the user retry, don't sign them out)
 */
const AuthContext = createContext(null);

const GUEST = { status: "guest", user: null, preferences: null };

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: "loading", user: null, preferences: null });

  const signOut = useCallback(async () => {
    await tokenStore.set(null);
    clearSocialSessions();
    // Drop every cached response that belonged to this user.
    queryClient.clear();
    setState(GUEST);
  }, [queryClient]);

  const loadProfile = useCallback(async () => {
    try {
      const { user, preferences } = await userApi.profile();
      setState({ status: "authenticated", user, preferences });
      return user;
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        await tokenStore.set(null);
        setState(GUEST);
      } else {
        setState({ status: "offline", user: null, preferences: null });
      }
      return null;
    }
  }, []);

  /** Call with the token from login / social login / 2FA. Resolves to the user. */
  const signIn = useCallback(
    async (token) => {
      await tokenStore.set(token);
      setState((prev) => ({ ...prev, status: "loading" }));
      return loadProfile();
    },
    [loadProfile],
  );

  /** Re-pull user + preferences after a profile edit, without a loading flash. */
  const refreshProfile = useCallback(async () => {
    try {
      const { user, preferences } = await userApi.profile();
      setState((prev) => ({ ...prev, user, preferences }));
    } catch {
      // keep the current data; a 401 signs out via the handler below
    }
  }, []);

  // One-time session restore from the keystore.
  useEffect(() => {
    let cancelled = false;
    tokenStore.load().then((token) => {
      if (cancelled) return;
      if (token) loadProfile();
      else setState(GUEST);
    });
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  // Any 401 from the API (expired token, password changed elsewhere, blocked
  // mid-session) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(() => {});
  }, [signOut]);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === "authenticated",
      signIn,
      signOut,
      refreshProfile,
      retry: loadProfile,
    }),
    [state, signIn, signOut, refreshProfile, loadProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
