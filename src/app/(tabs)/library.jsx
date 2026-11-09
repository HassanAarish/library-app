import { useState } from "react";
import { Alert, Platform, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { BookOpen, CalendarClock, Clock, History } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useMyRentals, useRentalAction } from "@/hooks/useRentals";
import { useCountdown } from "@/hooks/useCountdown";
import {
  Badge,
  BookCover,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  Screen,
  Segmented,
  Skeleton,
  Text,
} from "@/ui";
import SignInPrompt from "@/components/SignInPrompt";

const TONE = {
  pending_payment: "warning",
  payment_review: "info",
  scheduled: "brand",
  active: "success",
  completed: "neutral",
  cancelled: "neutral",
};

const isLive = (r, now) => new Date(r.startDate) <= now && new Date(r.endDate) > now;

/** Split rentals into reading now / upcoming / history. */
const groupRentals = (list) => {
  const now = new Date();
  const reading = [];
  const upcoming = [];
  const history = [];
  for (const r of list) {
    if (["completed", "cancelled"].includes(r.status) || new Date(r.endDate) <= now) {
      history.push(r);
    } else if (["active", "scheduled"].includes(r.status) && isLive(r, now)) {
      reading.push(r);
    } else {
      upcoming.push(r);
    }
  }
  upcoming.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  return { reading, upcoming, history };
};

const RentalCard = ({ rental, kind, onReturn, onCancel, extendAction, startNowAction }) => {
  const { t, date } = useI18n();
  const book = rental.bookId ?? {};
  const countdown = useCountdown(kind === "reading" ? rental.endDate : null);

  const isUnconfirmed = rental.status === "pending_payment" || rental.status === "payment_review";
  const statusLabel = isUnconfirmed
    ? t("mobile.availability.notConfirmed")
    : t(`library.status.${rental.status}`);
  const statusTone = isUnconfirmed ? "warning" : TONE[rental.status] || "neutral";

  const meta =
    kind === "reading"
      ? t("library.until", { date: date(rental.endDate) })
      : kind === "upcoming"
        ? t("library.startsOn", { date: date(rental.startDate) })
        : rental.status === "cancelled"
          ? t("library.cancelledOn", { date: date(rental.cancelledAt ?? rental.updatedAt) })
          : t("library.endedOn", { date: date(rental.returnedAt ?? rental.endDate) });

  return (
    <Card className="gap-3">
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => book._id && router.push(`/books/${book._id}`)}
          accessibilityRole="button"
          accessibilityLabel={book.title}
        >
          <BookCover src={book.coverImage?.url} title={book.title} author={book.author} size="sm" />
        </Pressable>
        <View className="min-w-0 flex-1 justify-between">
          <View>
            <Pressable onPress={() => book._id && router.push(`/books/${book._id}`)}>
              <Text variant="heading" weight="semibold" numberOfLines={2}>
                {book.title}
              </Text>
            </Pressable>
            <Text variant="caption" className="mt-0.5 text-fg-muted" numberOfLines={1}>
              {book.author}
            </Text>
          </View>

          <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
            <Badge tone={statusTone}>{statusLabel}</Badge>
            {rental.paymentMethod === "credit" ? (
              <Badge tone="gold">{t("rent.viaCredit")}</Badge>
            ) : null}
            {rental.extended ? <Badge>{t("library.extended")}</Badge> : null}
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-between border-t border-line pt-2">
        <Text variant="caption" className="text-fg-subtle">
          {meta}
          {rental.status === "cancelled" && rental.cancelReason
            ? ` · ${t(`library.cancelReason.${rental.cancelReason}`)}`
            : null}
        </Text>
        {kind === "reading" && countdown && !countdown.done ? (
          <View className="flex-row items-center gap-1">
            <Icon as={Clock} tone="brand" size={13} />
            <Text variant="caption" weight="medium" className="text-brand">
              {countdown.text}
            </Text>
          </View>
        ) : null}
      </View>

      {kind === "reading" ? (
        <View className="flex-row flex-wrap items-center gap-2 pt-1">
          <Button size="sm" icon={BookOpen} onPress={() => router.push(`/read/${book._id}`)}>
            {t("library.read")}
          </Button>
          {!rental.extended ? (
            <Button
              size="sm"
              variant="secondary"
              loading={extendAction.isPending}
              onPress={() => extendAction.mutate(rental)}
            >
              {t("library.extend")}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onPress={() => onReturn(rental)}>
            {t("library.returnBook")}
          </Button>
        </View>
      ) : null}

      {kind === "upcoming" ? (
        <View className="flex-row flex-wrap items-center gap-2 pt-1">
          {rental.status === "scheduled" ? (
            <Button
              size="sm"
              variant="secondary"
              loading={startNowAction.isPending}
              onPress={() => startNowAction.mutate(rental)}
            >
              {t("library.startNow")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="text-danger"
            onPress={() => onCancel(rental)}
          >
            {t("library.cancel")}
          </Button>
        </View>
      ) : null}
    </Card>
  );
};

/** My library: current and upcoming rentals, open the reader (M3). */
export default function LibraryScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const brand = useCSSVariable("--color-brand");
  const [tab, setTab] = useState("reading");

  const { data: list = [], isLoading, isFetching, isError, error, refetch } = useMyRentals();
  const cancelAction = useRentalAction("cancel");
  const returnAction = useRentalAction("return");
  const extendAction = useRentalAction("extend");
  const startNowAction = useRentalAction("startNow");

  const { reading, upcoming, history } = groupRentals(list);

  const confirmReturn = (rental) => {
    if (Platform.OS === "web") {
      return returnAction.mutate(rental);
    }
    return Alert.alert(t("library.confirmReturnTitle"), t("library.confirmReturnBody"), [
      { text: t("library.keep"), style: "cancel" },
      {
        text: t("library.returnBook"),
        style: "destructive",
        onPress: () => returnAction.mutate(rental),
      },
    ]);
  };

  const confirmCancel = (rental) => {
    if (Platform.OS === "web") {
      return cancelAction.mutate(rental);
    }
    return Alert.alert(
      t("library.confirmCancelTitle"),
      rental.paymentMethod === "credit"
        ? t("library.confirmCancelCredit")
        : t("library.confirmCancelPaid"),
      [
        { text: t("library.keep"), style: "cancel" },
        {
          text: t("library.cancel"),
          style: "destructive",
          onPress: () => cancelAction.mutate(rental),
        },
      ],
    );
  };

  if (!isAuthenticated) {
    return (
      <Screen>
        <PageHeader eyebrow={t("library.eyebrow")} title={t("nav.myLibrary")} />
        <SignInPrompt />
      </Screen>
    );
  }

  const currentItems = tab === "reading" ? reading : tab === "upcoming" ? upcoming : history;

  const emptyConfig = {
    reading: {
      icon: BookOpen,
      title: t("library.readingEmpty"),
      action: t("library.browse"),
      onAction: () => router.navigate("/books"),
    },
    upcoming: {
      icon: CalendarClock,
      title: t("library.upcomingEmpty"),
      action: t("library.browse"),
      onAction: () => router.navigate("/books"),
    },
    history: {
      icon: History,
      title: t("library.historyEmpty"),
    },
  }[tab];

  return (
    <Screen scroll={false}>
      <PageHeader
        eyebrow={t("library.eyebrow")}
        title={t("nav.myLibrary")}
        description={t("library.description")}
        className="mb-4"
      />

      <Segmented
        label={t("library.title")}
        value={tab}
        onChange={setTab}
        options={[
          ["reading", `${t("library.reading")}${reading.length ? ` (${reading.length})` : ""}`],
          ["upcoming", `${t("library.upcoming")}${upcoming.length ? ` (${upcoming.length})` : ""}`],
          ["history", `${t("library.history")}${history.length ? ` (${history.length})` : ""}`],
        ]}
      />

      <ScrollView
        contentContainerClassName="pt-4 pb-12 gap-4"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={brand}
          />
        }
      >
        {isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : isLoading ? (
          <View className="gap-4">
            <Skeleton className="h-36 w-full rounded-card" />
            <Skeleton className="h-36 w-full rounded-card" />
          </View>
        ) : currentItems.length === 0 ? (
          <EmptyState
            icon={emptyConfig.icon}
            title={emptyConfig.title}
            action={emptyConfig.action}
            onAction={emptyConfig.onAction}
          />
        ) : (
          currentItems.map((rental) => (
            <RentalCard
              key={rental._id}
              rental={rental}
              kind={tab}
              onReturn={confirmReturn}
              onCancel={confirmCancel}
              extendAction={extendAction}
              startNowAction={startNowAction}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
