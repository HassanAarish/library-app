import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "./cn";
import Text from "./Text";

/**
 * Small in-app messages (the website uses react-toastify):
 *   const toast = useToast(); toast.show("Saved"); toast.show("Blocked", { tone: "danger" })
 * Shown at the top, under the status bar; tap to dismiss. Screen readers
 * announce each one.
 */
const ToastContext = createContext(null);

const TONES = {
  neutral: "bg-fg",
  success: "bg-success",
  danger: "bg-danger",
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const show = useCallback(
    (message, { tone = "neutral", duration = 3500 } = {}) => {
      if (!message) return;
      clearTimeout(timer.current);
      setToast({ message: String(message), tone, id: Date.now() });
      AccessibilityInfo.announceForAccessibility(String(message));
      timer.current = setTimeout(hide, duration);
    },
    [hide],
  );

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="box-none"
          style={{ top: insets.top + 8 }}
          className="absolute inset-x-4 items-center"
        >
          <Pressable
            key={toast.id}
            onPress={hide}
            accessibilityRole="alert"
            className={cn("w-full max-w-md rounded-xl px-4 py-3 shadow-lg", TONES[toast.tone])}
          >
            <Text variant="label" weight="medium" className="text-canvas">
              {toast.message}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};
