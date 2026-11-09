import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { BookOpen } from "lucide-react-native";
import { useI18n } from "@/i18n";
import { useNewArrivals } from "@/hooks/useBooks";
import { Button, EmptyState, ErrorState, Logo, Screen, Text } from "@/ui";
import BookCard, { BookCardSkeleton } from "@/components/books/BookCard";
import { TextLink } from "@/components/auth/AuthScreen";

const SHELF_CARD = 132;

/** Home: welcome and a shelf of new arrivals. */
export default function HomeScreen() {
  const { t } = useI18n();
  const { data: books = [], isLoading, isError, error, refetch } = useNewArrivals();

  let shelf;
  if (isLoading) {
    shelf = (
      <View className="flex-row gap-4">
        {[0, 1, 2].map((i) => (
          <BookCardSkeleton key={i} width={SHELF_CARD} />
        ))}
      </View>
    );
  } else if (isError) {
    shelf = <ErrorState error={error} onRetry={refetch} />;
  } else if (!books.length) {
    shelf = (
      <EmptyState
        icon={BookOpen}
        title={t("catalog.emptyLibraryTitle")}
        description={t("catalog.emptyLibraryBody")}
      />
    );
  } else {
    shelf = (
      <FlatList
        horizontal
        data={books}
        keyExtractor={(b) => b._id}
        renderItem={({ item }) => <BookCard book={item} width={SHELF_CARD} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}
        className="-mx-4"
      />
    );
  }

  return (
    <Screen>
      <Logo className="mb-8" />
      <Text variant="eyebrow">{t("mobile.home.eyebrow")}</Text>
      <Text variant="display" accessibilityRole="header" className="mt-2">
        {t("mobile.home.title")}
      </Text>
      <Text className="mt-3 text-fg-muted">{t("mobile.home.subtitle")}</Text>
      <Button icon={BookOpen} className="mt-6" onPress={() => router.navigate("/books")}>
        {t("mobile.home.browse")}
      </Button>

      <View className="mb-4 mt-10 flex-row items-center justify-between">
        <Text variant="title" accessibilityRole="header">
          {t("home.newArrivals")}
        </Text>
        {books.length ? (
          <TextLink onPress={() => router.navigate("/books")}>{t("mobile.home.seeAll")}</TextLink>
        ) : null}
      </View>
      {shelf}
    </Screen>
  );
}
