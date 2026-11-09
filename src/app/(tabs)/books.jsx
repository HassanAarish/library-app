import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownUp, BookOpen, Search } from "lucide-react-native";
import { useCSSVariable } from "uniwind";
import { useI18n } from "@/i18n";
import { useCatalog, useCategories, useDebouncedValue } from "@/hooks/useBooks";
import { Button, Chips, EmptyState, ErrorState, Icon, Input, PageHeader, Screen, Text } from "@/ui";
import BookCard, { BookCardSkeleton } from "@/components/books/BookCard";

const LANGUAGES = ["English", "Urdu"];
// No price sorts: the app doesn't show prices (Google Play rule).
const SORTS = [
  ["newest", "catalog.sortNewest"],
  ["oldest", "catalog.sortOldest"],
  ["title", "catalog.sortTitle"],
];

/** The catalogue: search, category and language filters, endless two-column grid. Open to guests. */
export default function BooksScreen() {
  const { t } = useI18n();
  const brand = useCSSVariable("--color-brand");
  const params = useLocalSearchParams();
  const [draft, setDraft] = useState("");
  const search = useDebouncedValue(draft).trim();
  const [category, setCategory] = useState(params.category ?? "");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("newest");

  const query = useCatalog({ search, category, language, sort });
  const { data: categories = [] } = useCategories();
  const books = query.data?.books ?? [];
  const filtered = Boolean(search || category || language);

  const clearFilters = () => {
    setDraft("");
    setCategory("");
    setLanguage("");
  };
  const nextSort = () => {
    const i = SORTS.findIndex(([v]) => v === sort);
    setSort(SORTS[(i + 1) % SORTS.length][0]);
  };
  const sortLabel = t(SORTS.find(([v]) => v === sort)[1]);

  const header = (
    <View className="gap-3 pb-4">
      <PageHeader eyebrow={t("catalog.eyebrow")} title={t("catalog.title")} className="mb-1" />
      <Input
        value={draft}
        onChangeText={setDraft}
        accessibilityLabel={t("catalog.searchLabel")}
        placeholder={t("catalog.searchPlaceholder")}
        autoCorrect={false}
        returnKeyType="search"
        end={
          <View className="pe-3">
            <Icon as={Search} tone="fg-subtle" size={18} />
          </View>
        }
      />
      {categories.length ? (
        <Chips
          label={t("catalog.category")}
          value={category}
          onChange={setCategory}
          options={[["", t("catalog.allCategories")], ...categories.map((c) => [c._id, c.name])]}
        />
      ) : null}
      <Chips
        label={t("catalog.language")}
        value={language}
        onChange={setLanguage}
        options={[["", t("catalog.allLanguages")], ...LANGUAGES.map((l) => [l, l])]}
      />
      <View className="flex-row items-center justify-between">
        <Text variant="label" weight="semibold" accessibilityLiveRegion="polite">
          {query.data ? t("catalog.results", { count: query.data.total }) : " "}
        </Text>
        <Pressable
          onPress={nextSort}
          accessibilityRole="button"
          accessibilityLabel={`${t("catalog.sort")}: ${sortLabel}`}
          hitSlop={10}
          className="flex-row items-center gap-1.5"
        >
          <Icon as={ArrowDownUp} tone="fg-muted" size={14} />
          <Text variant="label" className="text-fg-muted">
            {sortLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  let empty = null;
  if (query.isLoading) {
    empty = (
      <View className="flex-row gap-4">
        <BookCardSkeleton />
        <BookCardSkeleton />
      </View>
    );
  } else if (query.isError) {
    empty = <ErrorState error={query.error} onRetry={query.refetch} />;
  } else if (filtered) {
    empty = (
      <EmptyState
        icon={BookOpen}
        title={t("catalog.emptyTitle")}
        description={t("catalog.emptyBody")}
        action={t("catalog.clearFilters")}
        onAction={clearFilters}
      />
    );
  } else {
    empty = (
      <EmptyState
        icon={BookOpen}
        title={t("catalog.emptyLibraryTitle")}
        description={t("catalog.emptyLibraryBody")}
        action={t("catalog.requestCta")}
        onAction={() => router.navigate("/requests")}
      />
    );
  }

  return (
    <Screen scroll={false} contentClassName="px-0 pt-0">
      <FlatList
        data={books}
        keyExtractor={(b) => b._id}
        numColumns={2}
        // The search box lives in the header: keep it as an element so typing never remounts it.
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={brand} className="py-6" />
          ) : query.isFetchNextPageError ? (
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 self-center"
              onPress={() => query.fetchNextPage()}
            >
              {t("common.retry")}
            </Button>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="max-w-1/2 flex-1">
            <BookCard book={item} />
          </View>
        )}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{
          gap: 24,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        // In the browser preview this fires on any scroll, even results shrinking.
        keyboardDismissMode={Platform.OS === "web" ? "none" : "on-drag"}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching && !query.isError) query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={query.refetch}
            tintColor={brand}
            colors={[brand]}
          />
        }
      />
    </Screen>
  );
}
