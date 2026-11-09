import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { BookX, MonitorSmartphone } from "lucide-react-native";
import { withUniwind } from "uniwind";
import { useI18n } from "@/i18n";
import { useBook } from "@/hooks/useBooks";
import {
  BackButton,
  Badge,
  BookCover,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  Loader,
  Text,
} from "@/ui";
import AvailabilityPanel from "@/components/books/AvailabilityPanel";

const StyledSafeArea = withUniwind(SafeAreaView);

const Fact = ({ label, value }) =>
  value ? (
    <View className="min-w-28 flex-1 basis-[40%]">
      <Text variant="caption">{label}</Text>
      <Text variant="label" weight="medium" className="mt-0.5">
        {value}
      </Text>
    </View>
  ) : null;

/** One book: cover, details and live availability. No price (Google Play rule). */
export default function BookScreen() {
  const { bookId } = useLocalSearchParams();
  const { t } = useI18n();
  const { data: book, isLoading, isError, error, refetch } = useBook(bookId);

  let body;
  if (isLoading) {
    body = <Loader className="py-24" />;
  } else if (isError) {
    body =
      error?.status === 404 ? (
        <EmptyState
          icon={BookX}
          title={t("book.notFoundTitle")}
          description={t("book.notFoundBody")}
          action={t("book.back")}
          onAction={() => router.replace("/books")}
          className="mt-8"
        />
      ) : (
        <ErrorState error={error} onRetry={refetch} className="mt-8" />
      );
  } else {
    body = (
      <>
        <View className="items-center">
          <BookCover
            src={book.coverImage?.url}
            title={book.title}
            author={book.author}
            width={176}
          />
        </View>

        {book.category?.name ? (
          <Badge tone="gold" className="mt-6">
            {book.category.name}
          </Badge>
        ) : null}
        <Text variant="display" accessibilityRole="header" className="mt-3">
          {book.title}
        </Text>
        <Text className="mt-1.5 text-fg-muted">{t("book.by", { author: book.author })}</Text>

        <View className="mt-6">
          <AvailabilityPanel book={book} />
        </View>

        <Text variant="heading" accessibilityRole="header" className="mt-8">
          {t("book.about")}
        </Text>
        <Text className="mt-2 text-fg-muted">{book.description || t("book.noDescription")}</Text>

        <Card className="mt-6 flex-row flex-wrap gap-4">
          <Fact label={t("book.language")} value={book.language} />
          <Fact label={t("book.pages")} value={book.pageCount} />
          <Fact label={t("book.published")} value={book.publishedYear} />
          <Fact label={t("book.isbn")} value={book.isbn} />
        </Card>

        <View className="mt-4 flex-row items-start gap-3">
          <Icon as={MonitorSmartphone} tone="brand" size={18} />
          <Text variant="label" className="flex-1 text-fg-muted">
            {t("mobile.book.readOnlyNote")}
          </Text>
        </View>
      </>
    );
  }

  return (
    <StyledSafeArea edges={["top", "bottom"]} className="flex-1 bg-canvas">
      <ScrollView contentContainerClassName="px-4 pb-8 pt-2">
        <BackButton className="mb-2" />
        {body}
      </ScrollView>
    </StyledSafeArea>
  );
}
