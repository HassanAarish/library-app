import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@/lib/api";
import { qk } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/ui";

/** Unread badge count. Live: the socket refreshes it on every new notification. */
export const useUnreadCount = () => {
  const { isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: qk.unreadCount,
    queryFn: notifications.unreadCount,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  return isAuthenticated ? (query.data?.unreadCount ?? 0) : 0;
};

/** The inbox, newest first, as an endless list. `unread` limits it to unread ones. */
export const useNotificationList = ({ unread = false } = {}) => {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: qk.notifications({ unread, list: "infinite" }),
    queryFn: ({ pageParam }) =>
      notifications.list({ page: pageParam, limit: 20, ...(unread && { unread: "true" }) }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: isAuthenticated,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.results),
      unreadCount: data.pages[0]?.unreadCount ?? 0,
    }),
  });
};

/** Mark read / mark all read / delete: each keeps the unread badge in step. */
const useInboxMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (typeof data?.unreadCount === "number") {
        queryClient.setQueryData(qk.unreadCount, { unreadCount: data.unreadCount });
      }
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
    onError: (err) => toast.show(err.message, { tone: "danger" }),
  });
};

export const useMarkRead = () => useInboxMutation((ids) => notifications.markRead(ids));
export const useMarkAllRead = () => useInboxMutation(() => notifications.markAllRead());
export const useDeleteNotification = () => useInboxMutation((id) => notifications.remove(id));
