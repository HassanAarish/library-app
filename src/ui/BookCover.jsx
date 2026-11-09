import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { cn } from "./cn";
import Text from "./Text";

// Deterministic, muted cloth colours for books without a cover image (same as the website).
const CLOTH = ["#1f5c4a", "#7a3b2e", "#2b4a6f", "#6b5a2e", "#4a3b5c", "#2e5c5a"];
const pick = (text = "") =>
  CLOTH[[...text].reduce((sum, c) => sum + c.charCodeAt(0), 0) % CLOTH.length];

/**
 * A book cover at 2:3. The typeset cloth cover (title + author) is underneath,
 * so a card is never blank while the image loads or if it fails.
 * `width` is in pixels; leave it out to fill the parent.
 */
const BookCover = ({ src, title = "", author, width, className }) => {
  const [failed, setFailed] = useState(false);
  const small = width !== undefined && width < 100;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={title ? `Cover of ${title}` : undefined}
      style={{ backgroundColor: pick(title), aspectRatio: 2 / 3, width: width ?? "100%" }}
      className={cn("justify-between overflow-hidden rounded-md p-2.5", className)}
    >
      <View className="h-px w-1/3 bg-white/50" />
      <View>
        <Text variant="heading" numberOfLines={4} className="text-sm/tight text-white">
          {title}
        </Text>
        {author && !small ? (
          <Text variant="caption" numberOfLines={2} className="mt-1 text-white/90">
            {author}
          </Text>
        ) : null}
      </View>
      <View className="h-px w-1/3 bg-white/50" />

      {src && !failed ? (
        <Image
          source={{ uri: src }}
          contentFit="cover"
          transition={200}
          onError={() => setFailed(true)}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
};

export default BookCover;
