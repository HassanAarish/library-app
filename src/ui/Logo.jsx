import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useCSSVariable } from "uniwind";
import { cn } from "./cn";
import Text from "./Text";

/** Wordmark: the bookmark-ribbon glyph + "LibraryHub", same as the website. */
const Logo = ({ compact = false, className }) => {
  const [brand, onBrand] = useCSSVariable(["--color-brand", "--color-on-brand"]);
  return (
    <View
      className={cn("flex-row items-center gap-2.5", className)}
      accessible
      accessibilityLabel="LibraryHub"
    >
      <View className="size-9 items-center justify-center rounded-lg bg-brand">
        <Svg viewBox="0 0 24 24" width={20} height={20}>
          <Path
            d="M5 4.5A1.5 1.5 0 0 1 6.5 3H17a2 2 0 0 1 2 2v14.5a.5.5 0 0 1-.8.4L12 15.5l-6.2 4.4a.5.5 0 0 1-.8-.4V4.5Z"
            fill={onBrand}
            opacity={0.92}
          />
          <Path d="M9 7.5h6M9 10.5h4" stroke={brand} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      </View>
      {compact ? null : (
        <Text variant="heading" className="text-xl">
          Library
          <Text variant="heading" className="text-xl text-brand">
            Hub
          </Text>
        </Text>
      )}
    </View>
  );
};

export default Logo;
