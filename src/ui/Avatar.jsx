import { useState } from "react";
import { Image, View } from "react-native";
import { cn } from "./cn";
import Text from "./Text";

const SIZES = {
  md: { box: "size-10", text: "text-sm" },
  lg: { box: "size-16", text: "text-xl" },
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

/** Profile photo with an initials fallback (also used when the image fails). */
const Avatar = ({ src, name, size = "md", className }) => {
  const [failed, setFailed] = useState(false);
  const s = SIZES[size];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn(
        "items-center justify-center overflow-hidden rounded-full bg-brand-soft",
        s.box,
        className,
      )}
    >
      {src && !failed ? (
        <Image
          source={{ uri: src }}
          onError={() => setFailed(true)}
          className="size-full"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text weight="semibold" className={cn("text-brand", s.text)}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
};

export default Avatar;
