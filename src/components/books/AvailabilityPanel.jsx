import { View } from "react-native";
import { router } from "expo-router";
import { CalendarClock, CircleCheck, Clock, Users } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useAvailability } from "@/hooks/useBooks";
import { useSocket } from "@/realtime/SocketProvider";
import { Badge, Button, Card, Icon, Skeleton, Text } from "@/ui";

const BOOKING_TONE = {
  pending_payment: "warning",
  payment_review: "info",
  scheduled: "brand",
  active: "success",
};

const Row = ({ icon, children }) => (
  <View className="flex-row items-start gap-3">
    <Icon as={icon} tone="fg-subtle" size={16} />
    <Text variant="label" className="flex-1 text-fg-muted">
      {children}
    </Text>
  </View>
);

/**
 * "Can I read this now?": free now, or rented until X, how many people are
 * ahead, and (signed in) your own booking and place in line. Live.
 *
 * Unlike the website there's no rent button or price: the app only reports
 * availability and opens what you've already rented (Google Play rule).
 */
const AvailabilityPanel = ({ book }) => {
  const { t, dateTime } = useI18n();
  const { isAuthenticated } = useAuth();
  const { connected } = useSocket();
  const { data, isLoading, isError, refetch } = useAvailability(book._id);

  const header = (
    <View className="mb-3 flex-row items-center justify-between">
      <Text variant="heading" accessibilityRole="header">
        {t("availability.title")}
      </Text>
      {connected ? (
        <View className="flex-row items-center gap-1.5">
          <View className="size-2 rounded-full bg-success" />
          <Text variant="caption">{t("availability.live")}</Text>
        </View>
      ) : null}
    </View>
  );

  if (isLoading) {
    return (
      <Card>
        {header}
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-full" />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        {header}
        <Text variant="label" className="text-fg-muted">
          {t("availability.error")}
        </Text>
        <Button variant="secondary" size="sm" className="mt-3 self-start" onPress={() => refetch()}>
          {t("common.retry")}
        </Button>
      </Card>
    );
  }

  const mine = data.myBooking;
  // Payment states get a neutral label: the app doesn't discuss payment.
  const bookingLabel =
    mine?.status === "pending_payment" || mine?.status === "payment_review"
      ? t("mobile.availability.notConfirmed")
      : mine && t(`availability.bookingStatus.${mine.status}`);

  return (
    <Card>
      {header}

      {mine ? (
        <View className="mb-4 gap-1.5 rounded-lg bg-brand-soft p-3">
          <View className="flex-row items-center justify-between gap-2">
            <Text variant="label" weight="semibold">
              {t("availability.yourBooking")}
            </Text>
            <Badge tone={BOOKING_TONE[mine.status] || "neutral"}>{bookingLabel}</Badge>
          </View>
          <Text variant="label" className="text-fg-muted">
            {mine.placeInLine === 0
              ? t("availability.readingNow")
              : t("availability.placeInLine", { count: mine.placeInLine })}
          </Text>
          <Text variant="caption">
            {dateTime(mine.startDate)} → {dateTime(mine.endDate)}
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center gap-2.5">
        <Icon
          as={data.availableNow ? CircleCheck : Clock}
          tone={data.availableNow ? "success" : "warning"}
        />
        <Text
          weight="semibold"
          className={data.availableNow ? "text-lg text-success" : "text-lg text-warning"}
        >
          {data.availableNow ? t("availability.availableNow") : t("availability.rentedNow")}
        </Text>
      </View>

      <View className="mt-3 gap-2.5">
        {data.availableNow ? (
          <Row icon={CalendarClock}>
            {t("mobile.availability.rentalLength", { days: data.rentalDays })}
          </Row>
        ) : (
          <>
            {data.currentRentalEndsAt ? (
              <Row icon={CalendarClock}>
                {t("availability.rentedUntil", { date: dateTime(data.currentRentalEndsAt) })}
              </Row>
            ) : null}
            <Row icon={Clock}>
              {t("availability.nextFree")} {dateTime(data.nextAvailableStart)}
            </Row>
            {!mine ? (
              <Row icon={Users}>
                {data.peopleAhead
                  ? t("availability.peopleAhead", { count: data.peopleAhead })
                  : t("availability.noOneAhead")}
              </Row>
            ) : null}
          </>
        )}
        {data.queueLength ? (
          <Row icon={Users}>{t("availability.queue", { count: data.queueLength })}</Row>
        ) : null}
      </View>

      {mine ? (
        <Button variant="secondary" className="mt-5" onPress={() => router.navigate("/library")}>
          {t("mobile.availability.openLibrary")}
        </Button>
      ) : !isAuthenticated ? (
        <Button variant="secondary" className="mt-5" onPress={() => router.push("/login")}>
          {t("mobile.availability.signIn")}
        </Button>
      ) : null}
    </Card>
  );
};

export default AvailabilityPanel;
