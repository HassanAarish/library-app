import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ScreenCapture from "expo-screen-capture";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Lock, Minus, Plus, ShieldAlert, X } from "lucide-react-native";
import { useCSSVariable, withUniwind } from "uniwind";
import { reader } from "@/lib/api";
import { readingPosition } from "@/lib/readingPosition";
import { useI18n } from "@/i18n";
import { Button, EmptyState, Icon, Input, Loader, Text } from "@/ui";

const StyledSafeArea = withUniwind(SafeAreaView);

const ZOOM_LEVELS = [1, 1.25, 1.5];

/**
 * /read/[bookId]: Full-screen page-by-page protected reader.
 * Pages are streamed as watermarked JPEGs and kept in memory only (cachePolicy="memory").
 * Screenshots and recordings are blocked via expo-screen-capture.
 */
export default function ReaderScreen() {
  const { bookId } = useLocalSearchParams();
  const { t, dateTime } = useI18n();
  const insets = useSafeAreaInsets();
  // The page's size comes from the screen (A-series paper, 1 : 1.414). Percent
  // sizes inside a ScrollView have nothing to measure against and collapse to 0.
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pageHeight = Math.min(screenHeight * 0.92, screenWidth * 1.414);
  const pageWidth = pageHeight / 1.414;
  const brand = useCSSVariable("--color-brand");

  const [page, setPage] = useState(1);
  // Nothing is saved until the saved page has been read back, or page 1 would
  // overwrite it on the first render.
  const [restored, setRestored] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
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

  // Reopen at the page the reader left off.
  useEffect(() => {
    let active = true;
    readingPosition.get(bookId).then((saved) => {
      if (!active) return;
      if (saved) setPage(saved);
      setRestored(true);
    });
    return () => {
      active = false;
    };
  }, [bookId]);

  useEffect(() => {
    if (restored && totalPages) readingPosition.set(bookId, current);
  }, [bookId, current, restored, totalPages]);

  // Access gone while reading (the rental ended): forget the saved page.
  const accessEnded =
    bookQuery.isError && bookQuery.error?.status === 403 && Boolean(bookQuery.data);
  useEffect(() => {
    if (accessEnded) readingPosition.clear(bookId);
  }, [accessEnded, bookId]);

  // Preload the next page, one ahead only (page requests count toward the
  // server's rate limit). cachePolicy "memory" is required: prefetch defaults to
  // memory AND disk, which would save watermarked pages to the phone.
  useEffect(() => {
    if (!bookQuery.isSuccess || current >= totalPages || imageError) return;
    const next = reader.pageSource(bookId, current + 1);
    Image.prefetch(next.uri, { headers: next.headers, cachePolicy: "memory" }).catch(() => {});
  }, [bookId, bookQuery.isSuccess, current, totalPages, imageError]);

  // One source object per page: a new object on every render makes the image
  // reload (and re-request the page) whenever any state changes.
  const pageSource = useMemo(() => reader.pageSource(bookId, current), [bookId, current]);

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

  // A failed re-check (e.g. a network blip) keeps the book open; only a book that
  // never opened, or whose access ended, shows this screen.
  if (bookQuery.isError && (!bookQuery.data || accessEnded)) {
    const isForbidden = bookQuery.error?.status === 403;
    return (
      <StyledSafeArea edges={["top", "bottom"]} className="flex-1 bg-canvas justify-center px-4">
        <EmptyState
          icon={Lock}
          title={accessEnded ? t("mobile.reader.endedTitle") : t("reader.noAccessTitle")}
          description={
            accessEnded
              ? t("mobile.reader.endedBody")
              : isForbidden
                ? t("mobile.reader.noAccessBody")
                : bookQuery.error?.message
          }
          action={t("mobile.availability.openLibrary")}
          onAction={() => router.replace("/(tabs)/library")}
        />
      </StyledSafeArea>
    );
  }

  const bookData = bookQuery.data;
  const currentZoom = ZOOM_LEVELS[zoomIndex];

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
          <Pressable
            onPress={() => setShowControls((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={t("mobile.reader.toggleControls")}
            style={{
              transform: [{ scale: currentZoom }],
              width: pageWidth,
              height: pageHeight,
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
                  onPress={() => {
                    // A new key remounts the image so it really asks for the page again.
                    setAttempt((a) => a + 1);
                    goToPage(current);
                  }}
                  className="mt-4"
                >
                  {t("common.retry")}
                </Button>
              </View>
            ) : (
              <Image
                key={`${bookId}-${current}-${attempt}`}
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
                  // A failed page can mean the rental just ended: if so, the
                  // server now answers 403 and the "ended" screen shows.
                  bookQuery.refetch();
                }}
                style={{ width: "100%", height: "100%" }}
              />
            )}

            {imageLoading && !imageError ? (
              <View className="absolute inset-0 items-center justify-center bg-surface/50">
                <ActivityIndicator size="large" color={brand} />
              </View>
            ) : null}
          </Pressable>
        </ScrollView>

        {/* Side strips turn pages. They leave the middle free, so taps on the page
            (show/hide controls), pinch-zoom and the Retry button still work. */}
        <Pressable
          onPress={() => current > 1 && goToPage(current - 1)}
          className="absolute inset-y-0 inset-s-0 w-1/5"
          accessibilityRole="button"
          accessibilityLabel={t("reader.previous")}
        />
        <Pressable
          onPress={() => current < totalPages && goToPage(current + 1)}
          className="absolute inset-y-0 inset-e-0 w-1/5"
          accessibilityRole="button"
          accessibilityLabel={t("reader.next")}
        />
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
              {t("mobile.reader.pageRange", { total: totalPages })}
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
