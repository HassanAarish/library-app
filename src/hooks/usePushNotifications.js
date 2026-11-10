import { useEffect, useEffectEvent, useRef } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { notifications } from "@/lib/api";
import { notificationLink } from "@/lib/notificationLink";
import { getPushToken, onPushOpened, pushSupported } from "@/lib/push";
import { pushDevice } from "@/lib/pushDevice";

/**
 * Push notifications, used once in the root layout:
 * - after sign-in (and on every start while signed in) ask for permission
 *   once and register this phone with the backend, unless the reader turned
 *   push off in their preferences;
 * - tapping a push marks it read and opens the matching screen, also when
 *   the tap launched the app.
 */
export const usePushNotifications = () => {
  const { status, isAuthenticated, user, preferences } = useAuth();
  const queryClient = useQueryClient();
  const pushWanted = preferences?.notifications?.push !== false;

  // Register this phone for the signed-in reader.
  useEffect(() => {
    if (!pushSupported || !isAuthenticated || !pushWanted) return;
    let cancelled = false;
    getPushToken({ ask: true }).then((device) => {
      if (device && !cancelled) pushDevice.register(device).catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id, pushWanted]);

  // Taps. One that arrives while the saved session is still loading (the tap
  // launched the app) waits in `waiting` until it's ready.
  const ready = status !== "loading";
  const readyRef = useRef(ready);
  const waiting = useRef(null);

  const open = useEffectEvent((data) => {
    if (isAuthenticated && data.notificationId) {
      notifications
        .markRead([data.notificationId])
        .then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }))
        .catch(() => {});
    }
    const to = notificationLink({ type: data.type, data: data.data });
    router.push(to ?? "/notifications");
  });

  useEffect(
    () =>
      onPushOpened((data) => {
        if (readyRef.current) open(data);
        else waiting.current = data;
      }),
    [],
  );

  useEffect(() => {
    readyRef.current = ready;
    if (ready && waiting.current) {
      const data = waiting.current;
      waiting.current = null;
      open(data);
    }
  }, [ready]);
};
