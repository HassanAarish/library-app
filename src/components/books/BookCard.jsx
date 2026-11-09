import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useI18n } from "@/i18n";
import { BookCover, Skeleton, Text } from "@/ui";

/**
 * Catalogue tile: cover, title, author; the whole card opens the book.
 * No price (Google Play rule, see README). `width` is for shelves; grids fill their column.
 */
const BookCard = ({ book, width }) => {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => router.push(`/books/${book._id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${t("book.by", { author: book.author })}`}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.75 : 1 })}
    >
      <BookCover src={book.coverImage?.url} title={book.title} author={book.author} />
      <Text variant="heading" numberOfLines={2} className="mt-2.5 text-base/snug">
        {book.title}
      </Text>
      <Text variant="label" numberOfLines={1} className="mt-0.5 text-fg-muted">
        {book.author}
      </Text>
    </Pressable>
  );
};

export const BookCardSkeleton = ({ width }) => (
  <View style={{ width }} className={width ? undefined : "flex-1"}>
    <Skeleton className="aspect-2/3 w-full" />
    <Skeleton className="mt-2.5 h-4 w-4/5" />
    <Skeleton className="mt-2 h-3.5 w-1/2" />
  </View>
);

export default BookCard;
