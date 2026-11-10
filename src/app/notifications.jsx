import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { Redirect, router } from "expo-router";
import { BellOff, Check, ChevronRight, Trash2 } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotificationList,
} from "@/hooks/useNotifications";
import { notificationLink } from "@/lib/notificationLink";
import { notificationText } from "@/lib/notificationText";
import { Button, EmptyState, ErrorState, Icon, Segmented, Skeleton, Text, cn } from "@/ui";
import StackPage from "@/components/StackPage";

const IconAction = ({ icon, label, onPress, tone = "fg-subtle" }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={6}
    className="size-10 items-center justify-center rounded-full"
  >
    <Icon as={icon} tone={tone} size={18} />
  </Pressable>
);

/** The inbox: all or unread; tap to open what it's about, mark read, delete. */
export default function NotificationsScreen() {
  const { t, relative } = useI18n();
  const { isAuthenticated } = useAuth();
  const brand = useCSSVariable("--color-brand");
  const [filter, setFilter] = useState("all");
  const query = useNotificationList({ unread: filter === "unread" });
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const remove = useDeleteNotification();

  if (!isAuthenticated) return <Redirect href="/login" />;

  const items = query.data?.items ?? [];
  const unread = query.data?.unreadCount ?? 0;

  const open = (n) => {
    if (!n.readAt) markRead.mutate([n._id]);
    const to = notificationLink(n);
    if (to) router.push(to);
  };

  const header = (
    <View className="gap-4 pb-4">
      <Text variant="display" accessibilityRole="header">
        {t("inbox.title")}
      </Text>
      <View className="flex-row items-center justify-between gap-3">
        <Segmented
          label={t("inbox.title")}
          value={filter}
          onChange={setFilter}
          className="flex-1"
          options={[
            ["all", t("inbox.all")],
            ["unread", t("inbox.unread")],
          ]}
        />
        {unread ? (
          <Button
            variant="ghost"
            size="sm"
            icon={Check}
            loading={markAll.isPending}
            onPress={() => markAll.mutate()}
          >
            {t("inbox.markAllRead")}
          </Button>
        ) : null}
      </View>
    </View>
  );

  return (
    <StackPage scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(n) => n._id}
        ListHeaderComponent={header}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-3">
              <Skeleton className="h-20 w-full rounded-card" />
              <Skeleton className="h-20 w-full rounded-card" />
            </View>
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={query.refetch} />
          ) : (
            <EmptyState
              icon={BellOff}
              title={filter === "unread" ? t("inbox.emptyUnread") : t("inbox.empty")}
            />
          )
        }
        renderItem={({ item: n }) => {
          const { title, message } = notificationText(t, n);
          const to = notificationLink(n);
          return (
            <View
              className={cn(
                "flex-row items-start gap-3 rounded-card border border-line p-3",
                n.readAt ? "bg-surface" : "bg-brand-soft",
              )}
            >
              <View className={cn("mt-2 size-2 rounded-full", n.readAt ? "bg-line" : "bg-brand")} />
              <Pressable
                onPress={() => open(n)}
                accessibilityRole="button"
                accessibilityLabel={`${title}. ${message}`}
                className="min-w-0 flex-1 gap-0.5"
              >
                <Text variant="label" weight={n.readAt ? "regular" : "semibold"}>
                  {title}
                </Text>
                <Text variant="label" className="text-fg-muted">
                  {message}
                </Text>
                <Text variant="caption">{relative(n.createdAt)}</Text>
              </Pressable>
              <View className="flex-row items-center">
                {!n.readAt ? (
                  <IconAction
                    icon={Check}
                    label={t("inbox.markRead")}
                    onPress={() => markRead.mutate([n._id])}
                  />
                ) : null}
                <IconAction
                  icon={Trash2}
                  label={t("inbox.delete")}
                  onPress={() => remove.mutate(n._id)}
                />
                {to ? (
                  <View className="rtl:rotate-180">
                    <Icon as={ChevronRight} tone="fg-subtle" size={16} />
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching) query.fetchNextPage();
        }}
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator color={brand} className="py-6" /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={query.refetch}
            tintColor={brand}
            colors={[brand]}
          />
        }
      />
    </StackPage>
  );
}
