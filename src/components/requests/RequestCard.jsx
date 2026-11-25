import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { BookCheck, Heart, Users } from "lucide-react-native";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useFollowRequest } from "@/hooks/useCommunity";
import { Badge, Button, Card, Icon, Text } from "@/ui";

const STATUS_TONE = {
  open: "neutral",
  reviewing: "info",
  planned: "gold",
  fulfilled: "success",
  rejected: "danger",
  merged: "neutral",
  withdrawn: "neutral",
};

export const RequestStatus = ({ status }) => {
  const { t } = useI18n();
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{t(`requests.status.${status}`)}</Badge>;
};

const OPEN = ["open", "reviewing", "planned"];

/** "I want this too" / "Following" toggle; a sign-in button for guests. */
export const FollowButton = ({ request, size = "sm" }) => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const follow = useFollowRequest();

  if (!OPEN.includes(request.status)) return null;
  if (!isAuthenticated) {
    return (
      <Button size={size} variant="secondary" onPress={() => router.push("/login")}>
        {t("requests.signInToFollow")}
      </Button>
    );
  }
  return (
    <Button
      size={size}
      variant={request.following ? "primary" : "secondary"}
      icon={Heart}
      loading={follow.isPending}
      accessibilityLabel={request.following ? t("requests.unfollow") : t("requests.follow")}
      onPress={() => follow.mutate({ request, follow: !request.following })}
    >
      {request.following ? t("requests.following") : t("requests.follow")}
    </Button>
  );
};

/** The action under a request: open the book once it's in, otherwise follow. */
export const RequestAction = ({ request, size = "sm" }) => {
  const { t } = useI18n();
  return request.status === "fulfilled" && request.book?._id ? (
    <Button size={size} icon={BookCheck} onPress={() => router.push(`/books/${request.book._id}`)}>
      {t("mobile.requests.seeBook")}
    </Button>
  ) : (
    <FollowButton request={request} size={size} />
  );
};

/** One request in a list: title, status, how many want it, latest note. */
const RequestCard = ({ request }) => {
  const { t } = useI18n();
  return (
    <Card className="gap-3">
      <Pressable
        onPress={() => router.push(`/requests/${request._id}`)}
        accessibilityRole="button"
        accessibilityLabel={request.title}
        className="gap-2"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text variant="heading" numberOfLines={2}>
              {request.title}
            </Text>
            {request.author ? (
              <Text variant="label" numberOfLines={1} className="text-fg-muted">
                {request.author}
              </Text>
            ) : null}
          </View>
          <RequestStatus status={request.status} />
        </View>
        <View className="flex-row items-center gap-1.5">
          <Icon as={Users} tone="fg-subtle" size={14} />
          <Text variant="caption">
            {t("requests.wanted", { count: request.followerCount ?? 0 })}
          </Text>
        </View>
        {request.statusNote ? (
          <Text
            variant="label"
            numberOfLines={2}
            className="rounded-lg bg-sunken px-3 py-2 text-fg-muted"
          >
            {request.statusNote}
          </Text>
        ) : null}
      </Pressable>
      <View className="flex-row">
        <RequestAction request={request} />
      </View>
    </Card>
  );
};

export default RequestCard;
