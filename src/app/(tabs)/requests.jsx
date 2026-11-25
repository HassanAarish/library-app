import { useState } from "react";
import { ActivityIndicator, FlatList, Platform, RefreshControl, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MessageSquarePlus, Plus, Search, Tags } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useDebouncedValue } from "@/hooks/useBooks";
import { useBookRequests, useMyBookRequests, useMyCategorySuggestions } from "@/hooks/useCommunity";
import {
  Badge,
  Button,
  Card,
  Chips,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  PageHeader,
  Screen,
  Segmented,
  Skeleton,
  Text,
} from "@/ui";
import RequestCard from "@/components/requests/RequestCard";
import SignInPrompt from "@/components/SignInPrompt";

const SUGGESTION_TONE = { pending: "info", approved: "success", rejected: "neutral" };

/** "Request a book" and "Suggest a category" (sign-in buttons for guests). */
const Actions = () => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <Button icon={Plus} onPress={() => router.push("/login")}>
        {t("requests.signInToRequest")}
      </Button>
    );
  }
  return (
    <View className="flex-row gap-2">
      <Button icon={Plus} className="flex-1" onPress={() => router.push("/requests/new")}>
        {t("requests.newRequest")}
      </Button>
      <Button
        variant="secondary"
        icon={Tags}
        accessibilityLabel={t("requests.categorySubmit")}
        onPress={() => router.push("/requests/suggest")}
      >
        {t("mobile.requests.category")}
      </Button>
    </View>
  );
};

/** Everyone's requests: search, open / added, most wanted or newest. */
const AllRequests = ({ header }) => {
  const { t } = useI18n();
  const brand = useCSSVariable("--color-brand");
  const [draft, setDraft] = useState("");
  const search = useDebouncedValue(draft).trim();
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("popular");
  const query = useBookRequests({ search, status, sort });
  const list = query.data?.requests ?? [];

  const top = (
    <View className="gap-3 pb-4">
      {header}
      <Input
        value={draft}
        onChangeText={setDraft}
        accessibilityLabel={t("requests.searchLabel")}
        placeholder={t("requests.searchPlaceholder")}
        autoCorrect={false}
        returnKeyType="search"
        end={
          <View className="pe-3">
            <Icon as={Search} tone="fg-subtle" size={18} />
          </View>
        }
      />
      <Chips
        label={t("requests.statusFilter")}
        value={status}
        onChange={setStatus}
        options={[
          ["", t("requests.allOpen")],
          ["fulfilled", t("requests.fulfilledFilter")],
        ]}
      />
      <Chips
        label={t("requests.sort")}
        value={sort}
        onChange={setSort}
        options={[
          ["popular", t("requests.sortPopular")],
          ["newest", t("requests.sortNewest")],
        ]}
      />
    </View>
  );

  let empty = null;
  if (query.isLoading) {
    empty = (
      <View className="gap-4">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </View>
    );
  } else if (query.isError) {
    empty = <ErrorState error={query.error} onRetry={query.refetch} />;
  } else {
    empty = (
      <EmptyState
        icon={MessageSquarePlus}
        title={search || status ? t("requests.empty") : t("requests.emptyAll")}
      />
    );
  }

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r._id}
      ListHeaderComponent={top}
      ListEmptyComponent={empty}
      renderItem={({ item }) => <RequestCard request={item} />}
      contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "web" ? "none" : "on-drag"}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetching && !query.isError) query.fetchNextPage();
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
  );
};

/** Requests I asked for or follow, and the categories I suggested. */
const MyRequests = ({ header }) => {
  const { t } = useI18n();
  const brand = useCSSVariable("--color-brand");
  const requests = useMyBookRequests();
  const suggestions = useMyCategorySuggestions();
  const list = requests.data ?? [];
  const mine = suggestions.data ?? [];

  return (
    <FlatList
      data={list}
      keyExtractor={(r) => r._id}
      ListHeaderComponent={<View className="pb-4">{header}</View>}
      renderItem={({ item }) => <RequestCard request={item} />}
      ListEmptyComponent={
        requests.isLoading ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : requests.isError ? (
          <ErrorState error={requests.error} onRetry={requests.refetch} />
        ) : (
          <EmptyState icon={MessageSquarePlus} title={t("requests.mineEmpty")} />
        )
      }
      ListFooterComponent={
        mine.length ? (
          <View className="mt-8 gap-3">
            <Text variant="heading" accessibilityRole="header">
              {t("requests.mySuggestions")}
            </Text>
            {mine.map((c) => (
              <Card key={c._id} className="gap-2">
                <View className="flex-row items-center justify-between gap-3">
                  <Text weight="semibold" className="flex-1">
                    {c.name}
                  </Text>
                  <Badge tone={SUGGESTION_TONE[c.status] ?? "neutral"}>
                    {t(`requests.suggestionStatus.${c.status}`)}
                  </Badge>
                </View>
                {c.reviewNote ? (
                  <Text variant="label" className="text-fg-muted">
                    {c.reviewNote}
                  </Text>
                ) : null}
              </Card>
            ))}
          </View>
        ) : null
      }
      contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={requests.isRefetching || suggestions.isRefetching}
          onRefresh={() => {
            requests.refetch();
            suggestions.refetch();
          }}
          tintColor={brand}
          colors={[brand]}
        />
      }
    />
  );
};

/** Requests tab: everyone's book requests, or mine; request a book or suggest a category. */
export default function RequestsScreen() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  const params = useLocalSearchParams();
  const [view, setView] = useState(params.view === "mine" ? "mine" : "all");
  // A notification can open this tab on "mine" while it's already mounted.
  const [lastParam, setLastParam] = useState(params.view);
  if (params.view !== lastParam) {
    setLastParam(params.view);
    if (params.view === "mine") setView("mine");
  }

  const header = (
    <View className="gap-4">
      <PageHeader
        eyebrow={t("requests.eyebrow")}
        title={t("requests.title")}
        description={t("requests.description")}
        className="mb-0"
      />
      <Actions />
      {isAuthenticated ? (
        <Segmented
          label={t("requests.eyebrow")}
          value={view}
          onChange={setView}
          options={[
            ["all", t("mobile.requests.all")],
            ["mine", t("requests.mineTitle")],
          ]}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} contentClassName="px-0 pt-0">
      {view === "mine" && isAuthenticated ? (
        <MyRequests header={header} />
      ) : view === "mine" ? (
        <View className="px-4 pt-4">
          <SignInPrompt />
        </View>
      ) : (
        <AllRequests header={header} />
      )}
    </Screen>
  );
}
