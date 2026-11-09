import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ScreenCapture from "expo-screen-capture";
import * as SecureStore from "expo-secure-store";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Lock, Minus, Plus, ShieldAlert, X } from "lucide-react-native";
import { useCSSVariable, withUniwind } from "uniwind";
import { reader } from "@/lib/api";
import { useI18n } from "@/i18n";
import { Button, EmptyState, Icon, Input, Loader, Text } from "@/ui";

const StyledSafeArea = withUniwind(SafeAreaView);

const ZOOM_LEVELS = [1, 1.25, 1.5];

const readInitialPage = (bookId) => {
  if (Platform.OS === "web") {
    try {
      const saved = Number(localStorage.getItem(`reader_page_${bookId}`));
      if (saved >= 1) return saved;
    } catch {
      // ignore
    }
  }
  return 1;
};

/**
 * /read/[bookId]: Full-screen page-by-page protected reader.
 * Pages are streamed as watermarked JPEGs and kept in memory only (cachePolicy="memory").
 * Screenshots and recordings are blocked via expo-screen-capture.
 */
export default function ReaderScreen() {
  const { bookId } = useLocalSearchParams();
  const { t, dateTime } = useI18n();
  const insets = useSafeAreaInsets();
  const brand = useCSSVariable("--color-brand");

  const [page, setPage] = useState(() => readInitialPage(bookId));
  const [zoomIndex, setZoomIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [jumpDraft, setJumpDraft] = useState("");

  // Block screen capture while inside the reader.
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  // Fetch book reader metadata (title, author, pageCount, accessUntil).
  const bookQuery = useQuery({
    queryKey: ["reader", bookId, "open"],
    queryFn: () => reader.open(bookId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const totalPages = bookQuery.data?.pageCount ?? 0;
  const current = Math.min(Math.max(page, 1), totalPages || 1);

  // Restore saved last-read page from SecureStore on native.
  useEffect(() => {
    if (Platform.OS === "web") return;
    let isMounted = true;
    const storeKey = `reader_page_${bookId}`;

    SecureStore.getItemAsync(storeKey)
      .then((saved) => {
        if (saved && isMounted) {
          const p = parseInt(saved, 10);
          if (p >= 1) setPage(p);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  // Persist current page.
  useEffect(() => {
    if (current < 1) return;
    const storeKey = `reader_page_${bookId}`;
    if (Platform.OS === "web") {
      try {
        localStorage.setItem(storeKey, String(current));
      } catch {
        // ignore
      }
      return;
    }
    SecureStore.setItemAsync(storeKey, String(current)).catch(() => {});
  }, [bookId, current]);

  // Prefetch the next page in memory (single page ahead to respect server rate-limits).
  useEffect(() => {
    if (!bookQuery.isSuccess || current >= totalPages || imageError) return;
    const next = current + 1;
    const nextSource = reader.pageSource(bookId, next);
    Image.prefetch(nextSource.uri, { headers: nextSource.headers }).catch(() => {});
  }, [bookId, bookQuery.isSuccess, current, totalPages, imageError]);

  const goToPage = useCallback(
    (target) => {
      if (!totalPages) return;
      const valid = Math.min(Math.max(target, 1), totalPages);
      setPage(valid);
      setImageError(false);
      setImageLoading(true);
    },
    [totalPages],
  );

  const handleJumpSubmit = () => {
    const parsed = parseInt(jumpDraft, 10);
    if (!Number.isNaN(parsed)) {
      goToPage(parsed);
    }
    setShowJumpModal(false);
    setJumpDraft("");
  };

  const handleNextZoom = () => {
    setZoomIndex((prev) => (prev + 1) % ZOOM_LEVELS.length);
  };

  if (bookQuery.isLoading) {
    return (
      <StyledSafeArea
        edges={["top", "bottom"]}
        className="flex-1 bg-canvas items-center justify-center"
      >
        <Loader />
        <Text variant="label" className="mt-4 text-fg-muted">
          {t("reader.loading")}
        </Text>
      </StyledSafeArea>
    );
  }

  if (bookQuery.isError) {
    const isForbidden = bookQuery.error?.status === 403;
    return (
      <StyledSafeArea edges={["top", "bottom"]} className="flex-1 bg-canvas justify-center px-4">
        <EmptyState
          icon={Lock}
          title={t("reader.noAccessTitle")}
          description={isForbidden ? t("reader.noAccessBody") : bookQuery.error?.message}
          action={t("mobile.availability.openLibrary")}
          onAction={() => router.replace("/(tabs)/library")}
        />
      </StyledSafeArea>
    );
  }

  const bookData = bookQuery.data;
  const currentZoom = ZOOM_LEVELS[zoomIndex];
  const pageSource = reader.pageSource(bookId, current);

  return (
    <View className="flex-1 bg-sunken">
      {/* Top Navigation Bar */}
      {showControls ? (
        <View
          style={{ paddingTop: insets.top }}
          className="absolute inset-x-0 top-0 z-30 border-b border-line bg-surface/95 px-3 pb-2.5 pt-2"
        >
          <View className="flex-row items-center justify-between gap-3">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t("reader.close")}
              hitSlop={12}
              className="size-10 items-center justify-center rounded-full bg-sunken"
            >
              <Icon as={X} size={20} tone="fg" />
            </Pressable>

            <View className="min-w-0 flex-1">
              <Text variant="heading" weight="semibold" numberOfLines={1}>
                {bookData?.title}
              </Text>
              <Text variant="caption" className="text-fg-subtle" numberOfLines={1}>
                {bookData?.author}
                {bookData?.accessUntil
                  ? ` · ${t("reader.accessUntil", { date: dateTime(bookData.accessUntil) })}`
                  : ""}
              </Text>
            </View>

            <Pressable
              onPress={handleNextZoom}
              accessibilityRole="button"
              accessibilityLabel={currentZoom > 1 ? t("reader.zoomOut") : t("reader.zoomIn")}
              hitSlop={8}
              className="flex-row items-center gap-1 rounded-full bg-sunken px-2.5 py-1.5"
            >
              <Icon as={currentZoom > 1 ? Minus : Plus} size={14} tone="fg-muted" />
              <Text variant="caption" weight="medium" className="text-fg-muted">
                {Math.round(currentZoom * 100)}%
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Main Page Area */}
      <View className="flex-1 items-center justify-center">
        <ScrollView
          contentContainerClassName="flex-grow items-center justify-center"
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          centerContent
        >
          <View
            style={{
              transform: [{ scale: currentZoom }],
              width: "100%",
              aspectRatio: 1 / 1.414,
              maxHeight: "92%",
            }}
            className="items-center justify-center"
          >
            {imageError ? (
              <View className="items-center justify-center p-6 text-center">
                <Icon as={ShieldAlert} tone="warning" size={36} className="mb-2" />
                <Text variant="label" weight="medium" className="text-center text-fg-muted">
                  {t("reader.pageError")}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => goToPage(current)}
                  className="mt-4"
                >
                  {t("common.retry")}
                </Button>
              </View>
            ) : (
              <Image
                key={`${bookId}-${current}`}
                source={pageSource}
                cachePolicy="memory"
                contentFit="contain"
                priority="high"
                onLoadStart={() => {
                  setImageLoading(true);
                  setImageError(false);
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                style={{ width: "100%", height: "100%" }}
              />
            )}

            {imageLoading && !imageError ? (
              <View className="absolute inset-0 items-center justify-center bg-surface/50">
                <ActivityIndicator size="large" color={brand} />
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Touch zones: left 25% for previous, center 50% for controls toggle, right 25% for next */}
        <View className="absolute inset-0 flex-row">
          <Pressable
            onPress={() => current > 1 && goToPage(current - 1)}
            className="w-1/4 h-full"
            accessibilityRole="button"
            accessibilityLabel={t("reader.previous")}
          />
          <Pressable
            onPress={() => setShowControls((prev) => !prev)}
            className="w-2/4 h-full"
            accessibilityRole="button"
            accessibilityLabel={t("reader.fit")}
          />
          <Pressable
            onPress={() => current < totalPages && goToPage(current + 1)}
            className="w-1/4 h-full"
            accessibilityRole="button"
            accessibilityLabel={t("reader.next")}
          />
        </View>
      </View>

      {/* Bottom Navigation Controls */}
      {showControls ? (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          className="absolute inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-2.5"
        >
          <View className="flex-row items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronLeft}
              disabled={current <= 1}
              onPress={() => goToPage(current - 1)}
              accessibilityLabel={t("reader.previous")}
            >
              {t("common.previous")}
            </Button>

            <Pressable
              onPress={() => {
                setJumpDraft(String(current));
                setShowJumpModal(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={t("reader.pageLabel")}
              hitSlop={8}
              className="rounded-full bg-sunken px-3.5 py-1.5"
            >
              <Text variant="caption" weight="medium" className="text-fg">
                {t("reader.page", { page: current, total: totalPages })}
              </Text>
            </Pressable>

            <Button
              variant="secondary"
              size="sm"
              icon={ChevronRight}
              disabled={current >= totalPages}
              onPress={() => goToPage(current + 1)}
              accessibilityLabel={t("reader.next")}
            >
              {t("common.next")}
            </Button>
          </View>
        </View>
      ) : null}

      {/* Jump To Page Modal */}
      <Modal
        visible={showJumpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJumpModal(false)}
      >
        <Pressable
          onPress={() => setShowJumpModal(false)}
          className="flex-1 items-center justify-center bg-black/50 px-6"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-card border border-line bg-surface p-5 shadow-lg"
          >
            <Text variant="heading" weight="semibold" className="mb-2">
              {t("reader.pageLabel")}
            </Text>
            <Text variant="caption" className="mb-3 text-fg-muted">
              {t("common.pageOf", { page: `1 - ${totalPages}`, total: totalPages })}
            </Text>

            <Input
              value={jumpDraft}
              onChangeText={setJumpDraft}
              keyboardType="number-pad"
              placeholder={String(current)}
              autoFocus
              className="mb-4"
            />

            <View className="flex-row justify-end gap-2">
              <Button variant="ghost" size="sm" onPress={() => setShowJumpModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" onPress={handleJumpSubmit}>
                {t("reader.pageLabel")}
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
