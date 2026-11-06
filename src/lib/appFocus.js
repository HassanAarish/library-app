import { AppState, Platform } from "react-native";
import { focusManager } from "@tanstack/react-query";

/**
 * React Query refetches stale data when the window regains focus on the web;
 * on a phone the equivalent is the app coming back to the foreground.
 * Call once at start-up; returns the unsubscribe function.
 */
export const watchAppFocus = () => {
  if (Platform.OS === "web") return () => {};
  const sub = AppState.addEventListener("change", (state) =>
    focusManager.setFocused(state === "active"),
  );
  return () => sub.remove();
};
