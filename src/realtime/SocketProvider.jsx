import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { socketURL } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { qk } from "@/lib/queryClient";
import { tokenStore } from "@/lib/tokenStore";
import { useToast } from "@/ui";
import { notificationText } from "@/lib/notificationText";

/**
 * One Socket.IO connection for the app (ported from the website): anonymous
 * for visitors, with the token once signed in; it reconnects when the session
 * changes and when the app returns to the foreground (Android drops sockets of
 * background apps).
 *
 *   notification:new   → toast + inbox/unread refresh (+ the area it's about)
 *   notification:read  → unread count from another device
 *   book:availability  → that book's availability (queue, place in line)
 *   account:blocked    → sign out
 */
const SocketContext = createContext(null);

// Which cached data a notification type makes stale.
const STALE_BY_TYPE = {
  payment: [["payments"], ["rentals"], ["packages"]],
  refund: [["payments"]],
  rental: [["rentals"]],
  package: [["packages"]],
  book_request: [["bookRequests"]],
  category: [["categories"]],
};

export const SocketProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { status, signOut } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (status === "loading") return undefined;
    const token = status === "authenticated" ? tokenStore.get() : null;

    const s = io(socketURL, {
      auth: token ? { token } : {},
      transports: ["websocket"],
      reconnectionDelayMax: 10_000,
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the socket is an external resource
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) => {
      setConnected(false);
      // A refused token (expired, password changed, blocked) ends the session.
      if (token && /expired|suspended|Not authorized|no longer exists/i.test(err.message)) {
        toast.show(
          /suspended/i.test(err.message) ? t("account.blocked") : t("account.sessionExpired"),
        );
        signOut();
      }
    });

    s.on("notification:new", (n) => {
      // The app's own wording for payment-related types (Google Play rule).
      toast.show(notificationText(t, n).title);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      const area = n.type?.split(".")[0];
      (STALE_BY_TYPE[area] || []).forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      );
    });

    s.on("notification:read", ({ unreadCount }) => {
      if (typeof unreadCount === "number") {
        queryClient.setQueryData(qk.unreadCount, { unreadCount });
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    });

    s.on("book:availability", ({ bookId }) => {
      queryClient.invalidateQueries({ queryKey: qk.availability(bookId) });
    });

    s.on("account:blocked", () => {
      toast.show(t("account.blocked"), { tone: "danger" });
      signOut();
    });

    // Back in the foreground: reconnect if Android dropped the socket.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && !s.connected) s.connect();
    });

    return () => {
      sub.remove();
      s.removeAllListeners();
      s.close();
      setConnected(false);
    };
  }, [status, queryClient, signOut, t, toast]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext) ?? { socket: null, connected: false };

/**
 * Live availability for a book screen: joins the book's room while mounted,
 * re-joining after a reconnect.
 */
export const useWatchBook = (bookId) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !bookId) return undefined;
    const join = () => socket.emit("book:watch", String(bookId));
    if (socket.connected) join();
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
      socket.emit("book:unwatch", String(bookId));
    };
  }, [socket, bookId]);
};
