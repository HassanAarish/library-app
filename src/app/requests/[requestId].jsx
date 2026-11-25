import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SearchX, Users } from "lucide-react-native";
import { useI18n } from "@/i18n";
import { useBookRequest } from "@/hooks/useCommunity";
import { BookCover, Card, EmptyState, ErrorState, Icon, Loader, Text } from "@/ui";
import { RequestAction, RequestStatus } from "@/components/requests/RequestCard";
import StackPage from "@/components/StackPage";

/** One request: details, follow (or open the book once it's in), and its timeline. */
export default function RequestScreen() {
  const { requestId } = useLocalSearchParams();
  const { t, date } = useI18n();
  const { data: r, isLoading, isError, error, refetch } = useBookRequest(requestId);

  if (isLoading) {
    return (
      <StackPage>
        <Loader className="py-24" />
      </StackPage>
    );
  }
  if (isError) {
    return (
      <StackPage>
        {error?.status === 404 ? (
          <EmptyState icon={SearchX} title={t("requests.notFound")} className="mt-8" />
        ) : (
          <ErrorState error={error} onRetry={refetch} className="mt-8" />
        )}
      </StackPage>
    );
  }

  const history = [...(r.history ?? [])].reverse();
  const facts = [
    t("requests.wanted", { count: r.followerCount ?? 0 }),
    r.language,
    r.isbn && `ISBN ${r.isbn}`,
  ].filter(Boolean);

  return (
    <StackPage>
      {r.book ? (
        <View className="mb-6 items-center">
          <BookCover
            src={r.book.coverImage?.url}
            title={r.book.title}
            author={r.book.author}
            width={140}
          />
        </View>
      ) : null}

      <RequestStatus status={r.status} />
      <Text variant="display" accessibilityRole="header" className="mt-3">
        {r.title}
      </Text>
      {r.author ? (
        <Text className="mt-1 text-fg-muted">{t("book.by", { author: r.author })}</Text>
      ) : null}
      <View className="mt-3 flex-row items-center gap-2">
        <Icon as={Users} tone="fg-subtle" size={14} />
        <Text variant="caption" className="flex-1">
          {facts.join(" · ")}
        </Text>
      </View>
      <View className="mt-5 flex-row">
        <RequestAction request={r} size="md" />
      </View>

      {r.statusNote ? (
        <Card className="mt-8 border-gold bg-gold-soft">
          <Text variant="eyebrow">{t("requests.adminNote")}</Text>
          <Text className="mt-1">{r.statusNote}</Text>
        </Card>
      ) : null}

      {history.length ? (
        <View className="mt-10">
          <Text variant="title" accessibilityRole="header" className="mb-4">
            {t("requests.timeline")}
          </Text>
          <View className="gap-5 border-s border-line ps-5">
            {history.map((h, i) => (
              <View key={`${h.status}-${h.at}-${i}`} className="gap-1.5">
                <View className="flex-row flex-wrap items-center gap-2">
                  <RequestStatus status={h.status} />
                  <Text variant="caption">{date(h.at)}</Text>
                </View>
                {h.note ? (
                  <Text variant="label" className="text-fg-muted">
                    {h.note}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </StackPage>
  );
}
