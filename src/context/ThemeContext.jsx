import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Uniwind, useUniwind } from "uniwind";

/**
 * Light / dark / system, like the website's ThemeContext. Uniwind follows the
 * phone's setting by default; a choice made in the app is remembered.
 *   const { preference, resolved, setPreference } = useTheme();
 */
const STORAGE_KEY = "theme";
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const { theme } = useUniwind(); // "light" | "dark" actually shown
  const [preference, setPref] = useState("system");

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") {
          setPref(saved);
          Uniwind.setTheme(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setPreference = useCallback((next) => {
    setPref(next);
    Uniwind.setTheme(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ preference, resolved: theme, isDark: theme === "dark", setPreference }),
    [preference, theme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
};
